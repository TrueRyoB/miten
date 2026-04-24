export default function ShelfPlank() {
    return (
        <>
        <style>{`
            .shelf-plank {
                position: fixed;
                bottom: 0; left: 0; right: 0;
                height: 72px;
                z-index: 10;
                pointer-events: none;
                background:
                    /* top highlight */
                    linear-gradient(180deg,
                    rgba(200,150,80,.6) 0px, rgba(200,150,80,.0) 4px
                    ),
                    /* Wood grain base */
                    linear-gradient(180deg,
                    #9a6535 0%, #7a4e26 18%, #6b4220 40%, #7a5230 60%, #5c3d1e 100%
                    );
                    border-top: 2px solid #b07840;
                    box-shadow:
                        0 -4px 20px rgba(0,0,0,.6),
                        inset 0 2px 4px rgba(255,200,100,.15);
                }

                /* Wood grain lines on plank */
                .shelf-plank::before {
                    content: '';
                    position: absolute; inset: 0;
                    background: repeating-linear-gradient(
                        90deg,
                        transparent 0px,
                        transparent 60px,
                        rgba(0,0,0,.06) 60px,
                        rgba(0,0,0,.06) 61px,
                        transparent 61px,
                        transparent 90px,
                        rgba(255,255,255,.04) 90px,
                        rgba(255,255,255,.04) 91px
                    );
                }
                .shelf-plank::after {
                    content: '';
                    position: absolute;
                    top: 0; left: 0; right: 0; height: 3px;
                    background: linear-gradient(90deg,
                        transparent, rgba(255,200,100,.25) 20%, rgba(255,200,100,.35) 50%, rgba(255,200,100,.25) 80%, transparent
                    );
                }
        `}</style>
        <div className="shelf-plank"></div>
        </>
    )
}