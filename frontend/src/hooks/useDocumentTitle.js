import { useEffect } from 'react';

const useDocumentTitle = (title, preserveOnUnmount = false) => {
    const defaultTitle = 'Marketplace - Buy and Sell Locally';

    useEffect(() => {
        document.title = title ? `${title} | Marketplace` : defaultTitle;
    }, [title]);

    useEffect(() => {
        return () => {
            if (!preserveOnUnmount) {
                document.title = defaultTitle;
            }
        };
    }, [preserveOnUnmount]);
};

export default useDocumentTitle;
