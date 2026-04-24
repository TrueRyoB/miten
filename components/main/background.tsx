/*
background components for the main page
*/

export default function Background() {
  return (
    <>
        <style>{`
            /* styles here are global unless you namespace */
            .background-root .room-bg {
                position: fixed; inset: 0;
                z-index: 0;
                /* Deep warm gradient suggesting a dimly lit library */
                background:
                radial-gradient(ellipse 80% 60% at 50% 0%,   #3d2a0f 0%, transparent 70%),
                radial-gradient(ellipse 40% 30% at 15% 30%,  #4a300e 0%, transparent 55%),
                radial-gradient(ellipse 40% 30% at 85% 30%,  #4a300e 0%, transparent 55%),
                radial-gradient(ellipse 60% 40% at 50% 100%, #5c3d1e 0%, transparent 60%),
                linear-gradient(180deg, #120b03 0%, #2a1808 30%, #3d2510 65%, #2a1808 100%);
                overflow: hidden;
            }
            
            /* Bookshelves in background (decorative rows of blurred books) */
            .background-root .room-bg::before {
                content: '';
                position: absolute; inset: 0;
                background-image:
                /* Top shelf row */
                repeating-linear-gradient(90deg,
                    transparent 0px, transparent 12px,
                    rgba(80,45,15,.6) 12px, rgba(80,45,15,.6) 13px
                ),
                /* Vertical book spines pattern */
                repeating-linear-gradient(90deg,
                    rgba(60,35,10,.0) 0px,
                    rgba(90,55,20,.15) 6px,
                    rgba(70,42,15,.0) 14px,
                    rgba(110,65,25,.12) 20px,
                    rgba(85,50,18,.0) 28px,
                    rgba(65,38,12,.18) 34px,
                    rgba(75,45,16,.0) 40px
                );
                opacity: .4;
                filter: blur(1px);
            }
            
            .background-root .room-bg::after {
                content: '';
                position: absolute;
                top: -60px; left: 50%; transform: translateX(-50%);
                width: 500px; height: 300px;
                background: radial-gradient(ellipse, rgba(220,170,80,.18) 0%, transparent 70%);
                pointer-events: none;
            }

            /* Side lamp glows */
            .lamp-left, .lamp-right {
                position: fixed;
                top: 15%; width: 260px; height: 260px;
                border-radius: 50%;
                pointer-events: none;
                z-index: 1;
            }
            .lamp-left  { left: -80px;  background: radial-gradient(circle, rgba(200,140,50,.14) 0%, transparent 70%); }
            .lamp-right { right: -80px; background: radial-gradient(circle, rgba(200,140,50,.14) 0%, transparent 70%); }
        `}</style>
        <div className="background-root">
        <div className="room-bg"></div>
        <div className="lamp-left"></div>
        <div className="lamp-right"></div>
        </div>
    </>
  )
}

/*
/* ═══════════════════════════════════════════
   LIBRARY ROOM BACKGROUND (CSS only)
═══════════════════════════════════════════ */