import React from 'react';

const AdminPagination = ({ currentPage, totalPages, onPageChange }) => {
    if (!totalPages || totalPages <= 1) return null;

    return (
        <div className="admin-pagination">
            <button
                onClick={() => onPageChange(currentPage - 1)}
                disabled={currentPage <= 1}
                className="admin-pagination-btn"
            >
                Previous
            </button>

            <div className="admin-pagination-pages">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <button
                        key={page}
                        onClick={() => onPageChange(page)}
                        className={`admin-pagination-btn ${currentPage === page ? 'active' : ''}`}
                    >
                        {page}
                    </button>
                ))}
            </div>

            <button
                onClick={() => onPageChange(currentPage + 1)}
                disabled={currentPage >= totalPages}
                className="admin-pagination-btn"
            >
                Next
            </button>
        </div>
    );
};

export default AdminPagination;
