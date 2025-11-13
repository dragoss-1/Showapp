import { useEffect, useState, useRef } from "react";
import { useParams } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../firebase";

const Sticker = () => {
  const { serviceId } = useParams();
  const [serviceData, setServiceData] = useState(null);
  const printRef = useRef();

useEffect(() => {
  const fetchService = async () => {
    try {
      let docRef = doc(db, "services", serviceId);
      let docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        docRef = doc(db, "archived_services", serviceId);
        docSnap = await getDoc(docRef);
      }

      if (docSnap.exists()) {
        setServiceData(docSnap.data());
      } else {
        console.log("Serviço não encontrado.");
      }
    } catch (error) {
      console.error("Erro ao buscar serviço:", error);
    }
  };

  if (serviceId && serviceId !== "0") {
    fetchService();
  } else {
    setServiceData({}); // dados vazios → manual
  }
}, [serviceId]);

  const formatDate = (dateStr) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    return `${String(date.getDate()).padStart(2, "0")}-${String(date.getMonth() + 1).padStart(2, "0")}-${date.getFullYear()}`;
  };

  return (
    <div className="sticker-wrapper">
    <div className="flex flex-col min-h-screen bg-gray-200">
      {serviceData ? (
        <>
          <div
            className="border bg-white rounded-lg shadow-md p-2 print-area flex flex-col"
            ref={printRef}
            style={{ width: "6cm", height: "4cm" }}
          >
            <div className="flex justify-between items-center mb-1">
              <img src="/logo.png" alt="Logo" className="w-5 h-5" />
              <div className="text-xs text-right">
                <div className="flex items-center">
                  <img src="/Car.jpg" alt="Car" className="w-30 h-5" />
                </div>
              </div>
            </div>

            <div className="flex flex-col text-xs gap-0 leading-tight">
              <div className="text-xs text-right mb-1">
                <div className="flex items-center">
                  <span className="font-bold mr-1 text-xs">Km:</span>
                  <input
                    type="text"
                    className="text-xs border-2 border-black w-16 mr-1"
                    defaultValue={serviceData?.km || ""}
                  />
                  <span className="font-bold mr-1 text-xs">Data:</span>
                  <input
                    type="text"
                    className="text-xs border-2 border-black w-16"
                    defaultValue={formatDate(serviceData.date)}
                  />
                </div>
              </div>

              <div className="flex flex-col text-[12px] gap-[0px] leading-[14px]">
                <div className="flex items-center mb-[4px]">
                  <span className="font-bold mr-[2px] text-[14px]">Lubrificante:</span>
                  <input
                    type="text"
                    className="border-2 border-black h-[10px] flex-1 text-[10px]"
                    defaultValue={serviceData.lubricant}
                  />
                </div>
              </div>

              <div className="flex items-center">
                <span className="font-bold text-xs mr-3">Filtros:</span>
                <div className="flex gap-2">
                  {["Óleo", "Ar", "Comb.", "Hab."].map((filtro, idx) => (
                    <label key={idx} className="flex items-center text-xs">
                      <input
                        type="checkbox"
                        className="border-2 border-black"
                        defaultChecked={serviceData.filters?.includes(filtro)}
                      />
                      {filtro}
                    </label>
                  ))}
                </div>
              </div>

              <span className="font-bold text-center mb-1 mt-2">Proximo serviço</span>
              <div className="text-xs text-center">
                <div>
                  <span className="font-bold">Km:</span>
                  <input
                    type="text"
                    className="border-2 border-black w-16 text-right ml-1 mr-1"
                    defaultValue={serviceData.next_km}
                  />
                  <span className="font-bold">Data:</span>
                  <input
                    type="text"
                    className="border-2 border-black w-16 text-right ml-1"
                    defaultValue={formatDate(serviceData.next_date)}
                  />
                </div>
              </div>
            </div>
          </div>

          <button
            onClick={() => window.print()}
            className="mt-4 bg-blue-500 text-white w-20 py-1 rounded print:hidden"
          >
            Imprimir
          </button>
        </>
      ) : (
        <p>Carregando...</p>
      )}
    </div>
    </div>
  );
};

export default Sticker;