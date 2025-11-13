// src/components/Loading.js
import React from 'react';

const Loading = () => {
    return (
        <div className="flex items-center justify-center h-screen bg-gray-200">
            <div className="flex items-center">
                <div className="animate-spin rounded-full h-16 w-16 border-t-8 border-blue-500 border-solid"></div>
                <h2 className="ml-4 text-2xl text-gray-700">Loading...</h2>
            </div>
        </div>
    );
};

export default Loading;