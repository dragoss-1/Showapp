import React from "react";
import { Widget } from "@uploadcare/react-widget";

const UploadComponent = ({ onFileUploaded }) => {
  const handleFileChange = (file) => {
    if (file && file.cdnUrl) {
      onFileUploaded(file.cdnUrl); // Envia a URL para o componente pai
    }
  };

  return (
    <div>
      <label className="block text-gray-700 font-bold mb-2">Carregar foto:</label>
      <Widget publicKey="70fc312c630f2041e100" onChange={handleFileChange} />
    </div>
  );
};

export default UploadComponent;