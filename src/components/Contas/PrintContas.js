import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { db } from '../../firebase';
import { doc, getDoc, collection, getDocs } from 'firebase/firestore';

const ServicePrint = () => {
    const { id } = useParams();
    const [service, setService] = useState(null);
    const [client, setClient] = useState(null);
    const [car, setCar] = useState(null);

useEffect(() => {
    const fetchService = async () => {
        try {
            // Tenta buscar primeiro em "services"
            let serviceRef = doc(db, 'services', id);
            let serviceSnap = await getDoc(serviceRef);

            // Se não encontrar, tenta em "archived_services"
            if (!serviceSnap.exists()) {
                serviceRef = doc(db, 'archived_services', id);
                serviceSnap = await getDoc(serviceRef);
            }

            if (serviceSnap.exists()) {
                const serviceData = serviceSnap.data();
                console.log("🔹 Serviço carregado:", serviceData);
                setService(serviceData);

                // Buscar o carro se existir um `carId`
                if (serviceData.carId) {
                    fetchCar(serviceData.carId);
                    fetchMaxKmFromServices(serviceData.carId);
                } else {
                    console.warn("⚠️ Nenhum 'carId' encontrado no serviço!");
                }
            } else {
                console.error("❌ Serviço não encontrado!");
            }
        } catch (error) {
            console.error('Erro ao buscar serviço:', error);
        }
    };

    const fetchCar = async (carId) => {
        try {
            const carRef = doc(db, 'cars', carId);
            const carSnap = await getDoc(carRef);

            if (carSnap.exists()) {
                const carData = carSnap.data();
                setCar(carData);
                console.log("🚗 Carro carregado:", carData);

                if (carData.clientId) {
                    fetchClient(carData.clientId);
                } else {
                    console.warn("⚠️ Nenhum 'clientId' encontrado no carro!");
                }
            } else {
                console.error("❌ Carro não encontrado!");
            }
        } catch (error) {
            console.error('Erro ao buscar carro:', error);
        }
    };

    const fetchClient = async (clientId) => {
        try {
            const clientRef = doc(db, 'clients', clientId);
            const clientSnap = await getDoc(clientRef);

            if (clientSnap.exists()) {
                setClient(clientSnap.data());
                console.log("👤 Cliente carregado:", clientSnap.data());
            } else {
                console.error("❌ Cliente não encontrado!");
            }
        } catch (error) {
            console.error('Erro ao buscar cliente:', error);
        }
    };

    const fetchMaxKmFromServices = async (carId) => {
        try {
            const servicesSnapshot = await getDocs(collection(db, 'services'));
            let maxKm = 0;

            servicesSnapshot.forEach(doc => {
                const service = doc.data();
                if (service.carId === carId && service.km) {
                    const kmNumber = parseInt(service.km.toString().replace(/\s/g, ''), 10);
                    if (!isNaN(kmNumber) && kmNumber > maxKm) {
                        maxKm = kmNumber;
                    }
                }
            });

        } catch (error) {
            console.error('Erro ao buscar km dos serviços:', error);
        }
    };

    fetchService();
}, [id]);


    return (
        <div className="container mx-auto p-4">
            <div className="flex items-center space-x-4">
                <img src="/logo.png" alt="Logo" className="w-40 mb-4" />
                <div className="mb-4 flex-1">
                    <h2 className="text-lg font-semibold"><strong>Mecânico</strong></h2>
                    <p><strong>Nome: </strong> Viorel Ariton</p>
                    <p><strong>Email: </strong> vio.ar.auto@gmail.com</p>
                    <p><strong>Telemóvel: </strong> 968403335</p>
                </div>
            </div>
            <h1 className="text-2xl font-bold mb-4">Detalhes do Serviço</h1>

            <div className="flex space-x-4">
                {client && (
                    <div className="mb-4 flex-1">
                        <h2 className="text-lg font-semibold"><strong>Dados do Cliente</strong></h2>
                        <p><strong>Nome:</strong> {client.name || 'N/A'}</p>
                        <p><strong>Email:</strong> {client.email || 'N/A'}</p>
                        <p><strong>Telefone:</strong> {client.phone || 'N/A'}</p>
                    </div>
                )}

                {car ? (
                    <div className="mb-4 flex-1">
                        <h2 className="text-lg font-semibold"><strong>Dados do Carro</strong></h2>
                        <p><strong>Nome: </strong> {car.name || 'N/A'}</p>
                        <p><strong>VIN: </strong> {car.vin || 'N/A'}</p>
                        <p><strong>Kms: </strong> {service?.km || 'N/A'}</p>
                        <p><strong>Ano: </strong> {car.year || 'N/A'}</p>
                    </div>
                ) : (
                    <p className="text-red-500">Carro não encontrado.</p>
                )}
            </div>

            {service ? (
                <div>
                    <div>
                        <br /><br />
                        <div className="print:hidden">
                            <strong>Descrição: </strong>{service.description}
                        </div>
                        <br />
                    </div>
                    <table className="min-w-full border border-gray-300 mb-4">
                        <thead>
                            <tr className="bg-gray-200">
                                <th className="border px-4 py-2">Código</th>
                                <th className="border px-4 py-2">Função</th>
                                <th className="border px-4 py-2">Preço (€)</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td className="border px-4 py-2">
                                    {Array.isArray(service.codigo) && service.codigo.length > 0 ? (
                                        service.codigo.map((item, index) => (
                                            <span key={index}>
                                                {item || 'N/A'}
                                                <br />
                                            </span>
                                        ))
                                    ) : service.codigo && service.codigo !== "" ? (
                                        service.codigo
                                    ) : (
                                        <span>N/A</span>
                                    )}
                                </td>
                                <td className="border px-4 py-2">
                                    {Array.isArray(service.type) ? service.type.map((item, index) => (
                                        <span key={index}>
                                            {item}
                                            <br />
                                        </span>
                                    )) : service.type || 'N/A'}
                                </td>
                                <td className="border px-4 py-2">
                                    {Array.isArray(service.costs) ? service.costs.map((item, index) => (
                                        <span key={index}>
                                            {item}€
                                            <br />
                                        </span>
                                    )) : service.totalCost ? service.totalCost + '€' : 'N/A'}
                                </td>
                            </tr>

                            {service.purchases && service.purchases.length > 0 && (
                                <>
                                    <tr className="bg-gray-200">
                                        <th className="border px-4 py-2" colSpan="2">Compras/Serviços de terceiros</th>
                                        <th className="border px-4 py-2">Preço (€)</th>
                                    </tr>
                                    {service.purchases.map((item, index) => (
                                        <tr key={index}>
                                            <td className="border px-4 py-2" colSpan="2">{item || 'N/A'}</td>
                                            <td className="border px-4 py-2">{service.purchasesprice?.[index] ? `${service.purchasesprice[index]}€` : 'N/A'}</td>
                                        </tr>
                                    ))}
                                </>
                            )}

                            <tr className="bg-gray-300 font-bold">
                                <td className="border px-4 py-2 text-right" colSpan="2">Total:</td>
                                <td className="border px-4 py-2">€{parseFloat(service.totalCost || 0).toFixed(2)}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            ) : (
                <p className="text-red-500">Serviço não encontrado.</p>
            )}
            
            <button onClick={() => window.print()} className="mt-4 bg-blue-500 text-white px-4 py-2 rounded print:hidden">
                Imprimir
            </button>
        </div>
    );
};

export default ServicePrint;
