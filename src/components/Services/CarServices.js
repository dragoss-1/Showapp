import React, { useState, useEffect } from 'react';
import Navbar from '../Navbar';
import { db } from '../../firebase';
import { collection, getDocs, doc, deleteDoc, getDoc, updateDoc, setDoc } from 'firebase/firestore';
import { useNavigate, useParams, Link, useLocation } from 'react-router-dom';

const CarServices = () => {
    const { id: carId } = useParams();
    const [services, setServices] = useState([]);
    const [car, setCar] = useState(null);
    const navigate = useNavigate();
    const location = useLocation();
    const queryParams = new URLSearchParams(location.search);
    const clientId = queryParams.get("clientId");
    const [loading, setLoading] = useState(true);
    const [loadingDots, setLoadingDots] = useState('');
    useEffect(() => {
        if (!loading) return;

        const interval = setInterval(() => {
            setLoadingDots(prev => (prev.length >= 3 ? '' : prev + '.'));
        }, 500);

        return () => clearInterval(interval);
    }, [loading]);

    useEffect(() => {
        const fetchData = async () => {
            if (carId && carId !== "0") {
                const carDoc = await getDoc(doc(db, 'cars', carId));
                if (carDoc.exists()) {
                    let carData = carDoc.data();
    
                    // Tenta buscar os dados do cliente
                    let clientName = "Cliente desconhecido";
                    if (carData.clientId) {
                        const clientDoc = await getDoc(doc(db, 'clients', carData.clientId));
                        if (clientDoc.exists()) {
                            clientName = clientDoc.data().name || "Cliente sem nome";
                        }
                    }
    
                    // Adiciona o nome do cliente ao objeto `car`
                    setCar({ ...carData, clientName });
                }
            }
        };
    
        fetchData();
    }, [carId]);

    const [carrosDoCliente, setCarrosDoCliente] = useState([]);

    useEffect(() => {
        const fetchCarrosDoCliente = async () => {
            if (clientId) {
                const carrosSnapshot = await getDocs(collection(db, "cars"));
                const carrosList = carrosSnapshot.docs
                    .map(doc => ({ id: doc.id, ...doc.data() }))
                    .filter(carro => carro.clientId === clientId);

                setCarrosDoCliente(carrosList);
            }
        };

        fetchCarrosDoCliente();
    }, [clientId]);

    useEffect(() => {
    const fetchData = async () => {
        setLoading(true);

        const collectionName = clientId || carId !== "0" ? "allservices" : "services";
        const servicesCollection = collection(db, collectionName);
        const servicesSnapshot = await getDocs(servicesCollection);

        let servicesList = [];

        for (const serviceDoc of servicesSnapshot.docs) {
        const serviceData = serviceDoc.data();
        const serviceId = serviceDoc.id;

        let carName = "Carro apagado";
        let clientName = "Cliente desconhecido";

        if (serviceData.carId) {
            const carDoc = await getDoc(doc(db, "cars", serviceData.carId));
            if (carDoc.exists()) {
            const carData = carDoc.data();
            carName = carData.name || "Carro sem nome";

            const clientDoc = await getDoc(doc(db, "clients", carData.clientId));
            if (clientDoc.exists()) {
                clientName = clientDoc.data().name || "Cliente sem nome";
            }
            }
        }

        // ⚠️ Adiciona este filtro para garantir que só entram serviços do carro específico
        if (carId !== "0" && serviceData.carId !== carId) continue;

        // Se estiveres a usar clientId
        if (clientId && !carrosDoCliente.some(carro => carro.id === serviceData.carId)) continue;

        servicesList.push({
            id: serviceId,
            ...serviceData,
            carName,
            clientName,
        });
        }

        setServices(servicesList);
        setLoading(false);
    };

    fetchData();
    }, [carId, clientId, carrosDoCliente]);   

    const toggleStatus = async (id, currentStatus) => {
    const newStatus = currentStatus === 'completed' ? 'in_progress' : 'completed';
    try {
        // Atualiza em services
        await updateDoc(doc(db, 'services', id), { status: newStatus });

        // Atualiza em allservices
        await updateDoc(doc(db, 'allservices', id), { status: newStatus });

        setServices(prevServices => {
        const updated = prevServices.map(service =>
            service.id === id ? { ...service, status: newStatus } : service
        );

        const updatedService = updated.find(s => s.id === id);
        if (updatedService.paid && updatedService.status === 'completed') {
            archiveService(updatedService);
        }

        return updated;
        });
    } catch (error) {
        console.error("Erro ao atualizar estado:", error);
    }
    };

    const togglePayment = async (id, isPaid) => {
    const newPaid = !isPaid;
    try {
        // Atualiza em services
        await updateDoc(doc(db, 'services', id), { paid: newPaid });

        // Atualiza em allservices
        await updateDoc(doc(db, 'allservices', id), { paid: newPaid });

        setServices(prevServices => {
        const updated = prevServices.map(service =>
            service.id === id ? { ...service, paid: newPaid } : service
        );

        const updatedService = updated.find(s => s.id === id);
        if (updatedService.paid && updatedService.status === 'completed') {
            archiveService(updatedService);
        }

        return updated;
        });
    } catch (error) {
        console.error("Erro ao atualizar pagamento:", error);
    }
    };

    const archiveService = async (service) => {
        const { id, ...data } = service;
        try {
            // Copia o documento para "archived_services"
            await setDoc(doc(db, 'archived_services', id), data);
            // Remove o original de "services"
            await deleteDoc(doc(db, 'services', id));
            // Atualiza estado local (remove da lista)
            setServices(prev => prev.filter(s => s.id !== id));
            console.log(`Serviço ${id} arquivado.`);
        } catch (error) {
            console.error("Erro ao arquivar serviço:", error);
        }
    };
        const handleDelete = async (id, service) => {
        if (window.confirm(`Deseja excluir o serviço "${service}"?`)) {
        try {
            // Apaga do 'services'
            await deleteDoc(doc(db, 'services', id));

            // Apaga também do 'allservices'
            await deleteDoc(doc(db, 'allservices', id));

            // Atualiza o estado local
            setServices(services.filter(service => service.id !== id));

            console.log("Serviço excluído com ID:", id);
        } catch (error) {
            console.error("Erro ao excluir serviço:", error);
        }
        }
        };
    const [filters, setFilters] = useState({
        client: "",
        name: "",
        date: "",
        type: "",
        status: "", //Para mostrar que esta em progresso
        totalcost: "",
        paid: ""
    });
    
    const handleFilterChange = (e) => {
        setFilters({
            ...filters,
            [e.target.name]: e.target.value
        });
    };

    const filteredServices = services.filter(service =>
        (filters.client === "" || service.clientName.toLowerCase().includes(filters.client.toLowerCase())) &&
        (filters.name === "" || service.carName.toLowerCase().includes(filters.name.toLowerCase())) &&
        (filters.date === "" || service.date.includes(filters.date)) &&
        (filters.type === "" || service.type.toLowerCase().includes(filters.type.toLowerCase())) &&
        (filters.status === "" || service.status.toLowerCase().includes(filters.status.toLowerCase())) &&
        (filters.totalcost === "" || service.totalcost.toString().includes(filters.totalcost)) &&
        (filters.paid === "" || service.paid.toString().includes(filters.paid))
    );

    const handleClick = () => {
        navigate('/archived-services/0');
    };

    return (
        <div className="h-screen">
            <Navbar />
            <div className="container mx-auto p-4">
                <h1 className="text-2xl font-bold mb-4">Serviços do Carro</h1>
                {carId && car && carId !== "0" && (
                    <div className="mb-4">
                        <h2 className="text-xl">Cliente: {car.clientName}</h2>
                        <h2 className="text-xl">Carro: {car.name}</h2>
                        <h2 className="text-xl">Placa: {car.licensePlate}</h2>
                        <h2 className="text-xl">Ano: {car.year}</h2>
                    </div>
                )}
                {carId === "0" && (
                    <div className="mb-4">
                        <input type="text" name="client" placeholder="Filtrar por Cliente" value={filters.client} onChange={handleFilterChange} className="border p-2 mr-2" />
                        <input type="text" name="name" placeholder="Filtrar por Carro" value={filters.name} onChange={handleFilterChange} className="border p-2 mr-2" />
                        <input type="text" name="type" placeholder="Filtrar por Serviço" value={filters.type} onChange={handleFilterChange} className="border p-2 mr-2" />
                        <input type="text" name="totalcost" placeholder="Filtrar por Preço" value={filters.totalcost} onChange={handleFilterChange} className="border p-2 mr-2" />
                        <br />
                        <input type="date" name="date" placeholder="Filtrar por Data" value={filters.date} onChange={handleFilterChange} className="border mt-2 p-2 mr-2" />     
                        <select name="status" value={filters.status} onChange={handleFilterChange} className="border p-2 mr-2">
                            <option value="">Todos os estados</option>
                            <option value="in_progress">Em execução</option>
                            <option value="completed">Finalizado</option>
                        </select>
                        <select name="paid" value={filters.paid} onChange={handleFilterChange} className="border p-2 mr-2">
                            <option value="">Todos os pagamentos</option>
                            <option value="true">Pago</option>
                            <option value="false">Por pagar</option>
                        </select>
                        <button
                            onClick={() => setFilters({ client: "", name: "", date: "", type: "", status: "", totalcost: "", paid: "" })}
                            className="bg-red-500 hover:bg-red-600 text-white py-2 px-4 rounded mr-2"
                        >
                            Limpar Filtros
                        </button>
                        <button
                            onClick={handleClick}
                            className="px-4 py-2 bg-gray-800 text-white rounded hover:bg-gray-700 transition"
                        >
                            Ver Arquivados
                        </button>
                        <button
                            onClick={() => navigate(`/sticker/0`)}
                            className="mt-4 bg-blue-500 text-white ml-2 py-2 px-4 rounded"
                            >
                            Imprimir autocolante
                        </button>
                    </div>
                )}
                <Link to={`/add-service/${carId}`} className="bg-green-500 text-white px-4 py-2 rounded mb-4 inline-block">
                    Adicionar Serviço
                </Link>
                {carId !== "0" ? (
                <button
                    onClick={() => navigate(-1)}
                    className="mt-4 ml-4 bg-gray-500 text-white px-4 py-2 rounded"
                >
                    Voltar
                </button>): null }
                <table className="min-w-full border border-gray-300">
                    <thead>
                        <tr className="bg-gray-200">
                            <th className="border px-4 py-2">Data</th>
                            <th className="border px-4 py-2">Serviço</th>
                            <th className="border px-4 py-2">Kms</th>
                            {carId === "0" && (<th className="border px-4 py-2">Carro</th>)}
                            {carId === "0" && <th className="border px-4 py-2">Cliente</th>}
                            <th className="border px-4 py-2">Estado</th>
                            <th className="border px-4 py-2">Preço</th>
                            <th className="border px-4 py-2">Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                    {loading ? (
                        <tr>
                            <td colSpan="8" className="border px-4 py-2 text-center">
                                A carregar serviços {loadingDots} <br />
                                <span className="text-sm text-gray-500">(Esta operação pode demorar um pouco)</span>
                            </td>
                        </tr>
                    ) : filteredServices.length > 0 ? (
                        [...filteredServices]
                            .sort((a, b) => new Date(b.date) - new Date(a.date)) // Ordena do mais recente para o mais antigo
                            .map((service) => (
                                <tr key={service.id}>
                                    {/* Data */}
                                    <td className="border px-4 py-2 w-[120px] whitespace-nowrap">
                                        {service.date ? new Date(service.date).toLocaleDateString('pt-PT') : 'N/A'}
                                    </td>
                                    
                                    {/* Código do Serviço */}
                                    <td className="border px-4 py-2">
                                        {Array.isArray(service.codigo) || Array.isArray(service.type) ? (
                                            (Array.isArray(service.codigo) ? service.codigo : String(service.codigo).split("," || []))
                                                .map((codigo, index) => (
                                                    <div key={index}>
                                                        {codigo} - {Array.isArray(service.type) ? service.type[index] : String(service.type).split(",")[index] || 'N/A'}
                                                    </div>
                                                ))
                                        ) : (
                                            <div>
                                                {service.codigo || 'N/A'} - {service.type || 'N/A'}
                                            </div>
                                        )}
                                    </td>

                                    {/* Kms */}
                                    <td className="border px-4 py-2 w-[120px] whitespace-nowrap">
                                        {service.km ? service.km : 'N/A'}
                                        <button
                                            onClick={() => navigate(`/sticker/${service.id}`)}
                                            className="mt-4 bg-green-500 text-white ml-2 py-2 px-4 rounded"
                                        >
                                            Imprimir
                                        </button>
                                    </td>

                                    {/* Nome do Carro (se carId for "0") */}
                                    {carId === "0" && <td className="border px-4 py-2">
                                        {service.carName.length > 25 ? service.carName.substring(0, 25) + "..." : service.carName}
                                    </td>}

                                    {/* Nome do Cliente */}
                                    {carId === "0" && <td className="border px-4 py-2">{service.clientName}</td>}

                                    {/* Status */}
                                    <td className="border px-4 py-2 text-center">
                                        <input
                                            type="checkbox"
                                            checked={service.status === 'completed'}
                                            onChange={() => toggleStatus(service.id, service.status)}
                                        />
                                        {service.status === 'completed' ? ' Finalizado✔️' : ' Em execução⏳'}
                                    </td>

                                    {/* Pagamento */}
                                    <td className="border px-4 py-2 text-center">
                                        <input
                                            type="checkbox"
                                            checked={service.paid}
                                            onChange={() => togglePayment(service.id, service.paid)}
                                        />
                                        {service.paid ? ` ${service.totalCost}€ pago✔️` : ` ${service.totalCost}€ por pagar❌`}
                                    </td>

                                    {/* Ações */}
                                    <td className="border px-4 py-2 text-center">
                                        <Link
                                            to={`/imprimir-conta/${service.id}`} // Rota para a página de detalhes do serviço
                                            className="bg-blue-500 text-white px-2 py-1 rounded mr-2"
                                        >
                                            Ver +
                                        </Link>
                                        <Link
                                            to={`/edit-service/${service.id}`}
                                            className="bg-yellow-500 text-white px-2 py-1 rounded mr-2"
                                        >
                                            Editar
                                        </Link>
                                        <button
                                            onClick={() => handleDelete(service.id, service.type)}
                                            className="bg-red-500 text-white px-2 py-1 rounded mt-3"
                                        >
                                            Excluir
                                        </button>
                                    </td>
                                </tr>
                            ))
                    ) : (
                        <tr>
                            <td colSpan="8" className="border px-4 py-2 text-center">
                                Nenhum serviço registrado.
                            </td>
                        </tr>
                    )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default CarServices;