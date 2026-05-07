import { useEffect } from 'react';

/**
 * AdSense Component
 * @param {string} slot - Ad slot ID
 * @param {string} format - Ad format (auto, fluid, etc.)
 * @param {object} style - CSS styles
 * @param {boolean} responsive - Whether the ad is responsive
 */
export default function AdSense({ slot, format = 'auto', style = { display: 'block' }, responsive = 'true' }) {
  const client = "ca-pub-3767875540639624";

  useEffect(() => {
    try {
      if (window.adsbygoogle) {
        (window.adsbygoogle = window.adsbygoogle || []).push({});
      }
    } catch (e) {
      console.warn("AdSense push error:", e);
    }
  }, []);

  return (
    <div className="adsense-wrapper" style={{ margin: '15px 0', minHeight: '90px', width: '100%', display: 'flex', justifyContent: 'center' }}>
      <ins
        className="adsbygoogle"
        style={style}
        data-ad-client={client}
        data-ad-slot={slot}
        data-ad-format={format}
        data-full-width-responsive={responsive}
      />
    </div>
  );
}

/**
 * Rewarded Ad Placeholder / H5 Game Ad Wrapper
 * Since AdSense Rewarded ads require specific SDK integration, 
 * we provide a container that can be used for H5 Game Ads.
 */
export function RewardedAd({ onComplete, lang }) {
  // In a real production environment, this would call the Google H5 Games SDK
  // or show a specific Rewarded Ad unit.
  
  const handleClose = () => {
    if (onComplete) onComplete();
  };

  return (
    <div className="rewarded-ad-overlay">
      <div className="rewarded-ad-container">
        <div className="ad-header">
          <span>{lang === 'ar' ? 'إعلان مكافأة' : 'REWARDED AD'}</span>
          <div className="ad-timer">15s</div>
        </div>
        
        {/* AdSense Rewarded Unit would go here */}
        <AdSense slot="REWARDED_PLACEHOLDER" format="fluid" style={{ display: 'block', width: '300px', height: '250px' }} />

        <div className="ad-footer">
          <p>{lang === 'ar' ? 'شاهد الإعلان للحصول على مكافأة في الجولة القادمة!' : 'Watch to get a bonus in the next round!'}</p>
          <button className="btn btn--secondary" onClick={handleClose}>
            {lang === 'ar' ? 'إغلاق' : 'CLOSE'}
          </button>
        </div>
      </div>
    </div>
  );
}
