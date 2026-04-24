export default function Board() {
    return (
        <>
            <style>{`
                .board-wrap {
                    position: relative;
                    z-index: 2;
                    min-height: 100vh;
                    display: flex;
                    flex-direction: column;
                    justify-content: flex-end;
                    padding-top: 50px;
                }
                .shelf-surface {
                    position: relative;
                    padding: 0 32px 0;
                    display: flex;
                    flex-direction: row;
                    align-items: flex-end;
                    gap: var(--col-gap);
                    /* Enough bottom space for shelf plank */
                    padding-bottom: 88px;
                    /* Top space so books can be tall */
                    padding-top: 40px;
                    overflow-x: auto;
                    overflow-y: visible;
                    min-height: calc(100vh - 50px);
                }

            `}</style>
            <div className="board-wrap">
                <div className="shelf-surface" id="board"></div>
            </div>
        </> 
    )
}