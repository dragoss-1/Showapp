import React, { useState, useEffect } from 'react';
import Navbar from '../Navbar';
import { db } from '../../firebase';
import { collection, getDocs, deleteDoc, doc, getDoc } from 'firebase/firestore';
import { useParams, useNavigate, Link } from 'react-router-dom';

const CarList = () => {
    const { id: clientId } = useParams();
    const [client, setClient] = useState(null);
    const [cars, setCars] = useState([]);
    const [clientsMap, setClientsMap] = useState({});
    const navigate = useNavigate();
    const [filters, setFilters] = useState({ name: '', year: '', licensePlate: '', client: '' });
    const [servicesKm, setServicesKm] = useState({});

    const [servicesCount, setServicesCount] = useState({});

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
        const fetchServicesCount = async () => {
            try {
                const servicesCollection = collection(db, 'allservices');
                const servicesSnapshot = await getDocs(servicesCollection);
                const serviceMap = {};

                servicesSnapshot.docs.forEach(doc => {
                    const service = doc.data();
                    if (service.carId) {
                        serviceMap[service.carId] = (serviceMap[service.carId] || 0) + 1;
                    }
                });

                setServicesCount(serviceMap);
            } catch (error) {
                console.error('Erro ao buscar os serviços:', error);
            }
        };

        fetchServicesCount();
    }, [cars]);


    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const carsCollection = collection(db, 'cars');
                let carsList = [];
                const clientsMap = {};

                if (!clientId || clientId === "0") {
                    const carsSnapshot = await getDocs(carsCollection);
                    carsList = carsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                } else {
                    const carsSnapshot = await getDocs(carsCollection);
                    carsList = carsSnapshot.docs
                        .map(doc => ({ id: doc.id, ...doc.data() }))
                        .filter(car => car.clientId === clientId);
    
                    const clientDoc = doc(db, 'clients', clientId);
                    const clientData = await getDoc(clientDoc);
                    if (clientData.exists()) {
                        setClient({ id: clientData.id, ...clientData.data() });
                    }
                }

                const clientsSnapshot = await getDocs(collection(db, 'clients'));
                clientsSnapshot.forEach(doc => {
                    clientsMap[doc.id] = doc.data().name;
                });

                setClientsMap(clientsMap);
                setCars(carsList);
                setLoading(false);
            } catch (error) {
                console.error('Erro ao buscar os dados:', error);
            }
        };
    
        fetchData();
    }, [clientId]);

    useEffect(() => {
        const fetchMaxKmServices = async () => {
            try {
                const servicesCollection = collection(db, 'allservices');
                const servicesSnapshot = await getDocs(servicesCollection);
                const kmMap = {};
    
                servicesSnapshot.docs.forEach(doc => {
                    const service = doc.data();
                    if (service.carId && service.km) {
                        const kmNumber = parseInt(service.km.toString().replace(/\s/g, ''), 10);
                        if (!kmMap[service.carId] || kmNumber > kmMap[service.carId]) {
                            kmMap[service.carId] = kmNumber;
                        }
                    }
                });
    
                setServicesKm(kmMap);
            } catch (error) {
                console.error('Erro ao buscar os maiores kms dos serviços:', error);
            }
        };
    
        fetchMaxKmServices();
    }, []);
    

    const handleDelete = async (id, car) => {
        if (window.confirm(`Deseja excluir o carro "${car}"?`)) {
        try {
            await deleteDoc(doc(db, 'cars', id));
            setCars(cars.filter(car => car.id !== id));
        } catch (error) {
            console.error('Erro ao excluir carro:', error);
        }}
    };

    const handleFilterChange = (e) => {
        setFilters({ ...filters, [e.target.name]: e.target.value });
    };
    const handleClearFilters = () => {
        setFilters({
            name: '',
            year: '',
            client: '',
            licensePlate: ''
        });
    };

    const filteredCars = cars.filter(car =>
        car.name.toLowerCase().includes(filters.name.toLowerCase()) &&
        car.year.toLowerCase().includes(filters.year.toLowerCase()) &&
        car.licensePlate.toLowerCase().includes(filters.licensePlate.toLowerCase()) &&
        (clientId === "0" ? (!filters.client || clientsMap[car.clientId]?.toLowerCase().includes(filters.client.toLowerCase())) : true)
    );

    return (
        <div className="h-screen">
            <Navbar />
            <div className="container mx-auto p-4">
                <h1 className="text-2xl font-bold mb-4">
                    {clientId && clientId !== "0" && client ? `Carros de ${client.name}` : 'Carros'}
                </h1>

                {clientId && client && clientId !== "0" && (
                    <div className="mb-4">
                        <h2 className="text-xl">Telefone: {client.phone}</h2>
                        {client.email !== "" && <h2 className="text-xl">Email: {client.email}</h2>}
                    </div>
                )}

                {clientId === "0" ? (
                <div className="mb-4">
                    <input type="text" name="name" placeholder="Filtrar por Carro" value={filters.name} onChange={handleFilterChange} className="border p-2 mr-2" />
                    {clientId === "0" && <input type="text" name="client" placeholder="Filtrar por Cliente" value={filters.client} onChange={handleFilterChange} className="border p-2 mr-2" />}
                    <input type="text" name="year" placeholder="Filtrar por Ano" value={filters.year} onChange={handleFilterChange} className="border p-2 mr-2" />
                    <input type="text" name="licensePlate" placeholder="Filtrar por Matrícula" value={filters.licensePlate} onChange={handleFilterChange} className="border p-2 mr-2" />
                    <button
                        onClick={handleClearFilters}
                        className="bg-red-500 hover:bg-red-600 text-white py-2 px-4 rounded"
                    >
                        Limpar Filtros
                    </button>
                </div>
                ) : null }

                {clientId && clientId !== "0" ? (
                    <button
                        onClick={() => navigate(`/add-car/${client.id}`)}
                        className="mt-4 bg-green-500 text-white px-4 py-2 rounded"
                    >
                        Adicionar Carro
                    </button>
                ) : (
                    <button
                        onClick={() => navigate(`/add-car/0`)}
                        className="mt-4 bg-blue-500 text-white px-4 py-2 rounded"
                    >
                        Adicionar Carro
                    </button>
                )}
                {clientId && clientId !== "0" ? (
                <button
                    onClick={() => navigate(-1)}
                    className="mt-4 ml-4 bg-gray-500 text-white px-4 py-2 rounded"
                >
                    Voltar
                </button>): null }
                <table className="min-w-full border border-gray-300 mt-4">
                    <thead>
                        <tr className="bg-gray-200">
                            <th className="border px-4 py-2">Carro</th>
                            <th className="border px-4 py-2">Ano</th>
                            {clientId === "0" && (<th className="border px-4 py-2">Cliente</th>)}
                            <th className="border px-4 py-2">Matrícula</th>
                            <th className="border px-4 py-2">Código VIN</th>
                            <th className="border px-4 py-2">Kms (1ª vez/Atual)</th>
                            <th className="border px-4 py-2">Serviços</th> 
                            <th className="border px-4 py-2">Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                    {loading ? (
                        <tr>
                            <td colSpan="8" className="border px-4 py-2 text-center">
                                A carregar serviços {loadingDots} <br />
                            </td>
                        </tr>
                    ) : cars.length > 0 ? (
                            filteredCars.map((car) => (
                                <tr key={car.id}>
                                    <td className="border px-4 py-2">
                                        {car.name.length > 25 ? car.name.substring(0, 25) + "..." : car.name}
                                    </td>
                                    <td className="border px-4 py-2">{car.year}</td>
                                    {clientId === "0" && (
                                        <td className="border px-4 py-2">
                                            {car.clientId && (
                                                <button
                                                    onClick={() => navigate(`/cars/${car.clientId}`)}
                                                >
                                                    {car.clientId ? clientsMap[car.clientId] || 'Cliente não encontrado ' : 'Sem cliente '}
                                                </button>
                                            )}
                                        </td>
                                    )}
                                    <td className="border px-4 py-2">{car.licensePlate}</td>
                                    <td className="border px-4 py-2">{car.vin}</td>
                                    <td className="border px-4 py-2">
                                        {car.km || 'N/A'}
                                        {servicesKm[car.id] !== undefined ? ` / ${servicesKm[car.id]}` : ''}
                                    </td>
                                    <td className="border px-4 min-w-[120px] py-2">{servicesCount[car.id] || 0}
                                        <Link
                                            to={`/car-services/${car.id}`}
                                            className="bg-blue-500 ml-2 text-white px-2 py-1 rounded"
                                        >
                                            Ver +
                                        </Link>
                                    </td>
                                    <td className="border px-4 py-2 text-center">
                                        <Link
                                            to={`/edit-car/${car.id}`}
                                            className="bg-yellow-500 text-white px-2 py-1 rounded mr-2"
                                        >
                                            Editar
                                        </Link>
                                        <button
                                            onClick={() => handleDelete(car.id, car.name)}
                                            className="bg-red-500 text-white px-2 py-1 rounded"
                                        >
                                            Excluir
                                        </button>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={clientId && clientId !== "0" ? "8" : "9"} className="border px-4 py-2 text-center">
                                    {clientId && clientId !== "0" ? 'Este cliente não possui carros registrados.' : 'Nenhum carro registrado.'}
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default CarList;