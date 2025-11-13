import React, { useState, useEffect } from 'react';
import { db } from '../../firebase'; // Importa o Firestore
import { collection, addDoc, getDocs, doc, getDoc } from 'firebase/firestore';
import { useNavigate, useParams } from 'react-router-dom';
import Navbar from '../Navbar'; // Importa a Navbar

const AddCar = () => {
    const { id: clientId } = useParams();
    const [carName, setCarName] = useState('');
    const [year, setYear] = useState('');
    const [vin, setVin] = useState('');
    const [licensePlate, setLicensePlate] = useState('');
    const [km, setKm] = useState('');
    const [clients, setClients] = useState([]);
    const [selectedClient, setSelectedClient] = useState(clientId !== "0" ? clientId : '');
    const [newClient, setNewClient] = useState({ name: '', phone: '', email: '' });
    const [clientName, setClientName] = useState('');
    const navigate = useNavigate();

    // Buscar clientes existentes
    useEffect(() => {
        const fetchClients = async () => {
            try {
                const clientsCollection = collection(db, 'clients');
                const clientsSnapshot = await getDocs(clientsCollection);
                const clientsList = clientsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setClients(clientsList);
            } catch (error) {
                console.error('Erro ao buscar clientes:', error);
            }
        };

        fetchClients();
    }, []);

    // Buscar nome do cliente se já existir
    useEffect(() => {
        if (clientId !== "0") {
            const fetchClientName = async () => {
                try {
                    const clientRef = doc(db, 'clients', clientId);
                    const clientSnap = await getDoc(clientRef);
                    if (clientSnap.exists()) {
                        setClientName(clientSnap.data().name);
                    }
                } catch (error) {
                    console.error('Erro ao buscar o nome do cliente:', error);
                }
            };

            fetchClientName();
        }
    }, [clientId]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const carsCollection = collection(db, 'cars');
            const carsSnapshot = await getDocs(carsCollection);

            // Verificar se o nome do carro já existe
            const existingCars = carsSnapshot.docs
                .map(doc => doc.data().name)
                .filter(name => name.startsWith(carName));

            let newName = carName;
            let count = 1;

            while (existingCars.includes(newName)) {
                count++;
                newName = `${carName} (${count})`;
            }

            let clientIdToUse = selectedClient;

            // Criar um novo cliente se necessário
            if (!selectedClient && newClient.name.trim()) {
                const newClientData = {
                    name: newClient.name.trim(),
                    phone: newClient.phone || "",
                    email: newClient.email || "" // Garante que o email é opcional
                };
                const newClientRef = await addDoc(collection(db, 'clients'), newClientData);
                clientIdToUse = newClientRef.id;
            }

            // Criar o carro com os dados ajustados
            const carData = {
                name: newName,
                year,
                vin,
                licensePlate,
                km: km || null,
                clientId: clientIdToUse || null,
            };

            await addDoc(carsCollection, carData);
            navigate(`/cars/${clientIdToUse || '0'}`);
        } catch (error) {
            console.error('Erro ao adicionar carro:', error);
        }
    };
        
    return (
        <div className="h-screen">
            <Navbar />
            <div className="container mx-auto p-4">
                <h1 className="text-2xl font-bold mb-4">Adicionar Carro {clientId !== "0" && <p className="text-lg font-semibold">Cliente: {clientName || "Carregando..."}</p>}</h1>
                <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                        <label className="block mb-1">Nome do Carro:</label>
                        <input type="text" value={carName} onChange={(e) => setCarName(e.target.value)} required className="border p-2 w-full" />
                    </div>
                    <div className="mb-4">
                        <label className="block mb-1">Ano:</label>
                        <input type="text" value={year} onChange={(e) => setYear(e.target.value)} required className="border p-2 w-full" />
                    </div>
                    <div className="mb-4">
                        <label className="block mb-1">Código VIN:</label>
                        <input type="text" value={vin} onChange={(e) => setVin(e.target.value)} required className="border p-2 w-full" />
                    </div>
                    <div className="mb-4">
                        <label className="block mb-1">Matrícula:</label>
                        <input type="text" value={licensePlate} onChange={(e) => setLicensePlate(e.target.value)} required className="border p-2 w-full" />
                    </div>
                    <div className="mb-4">
                        <label className="block mb-1">Kms:</label>
                        <input type="text" value={km} onChange={(e) => setKm(e.target.value)} className="border p-2 w-full" />
                    </div>
                    
                    {clientId === "0" && (
                        <>
                            <div className="mb-4">
                                <label className="block mb-1">Selecionar Cliente:</label>
                                <select 
                                    value={selectedClient} onChange={(e) => setSelectedClient(e.target.value)} 
                                    className="border p-2 w-full"
                                >
                                    {/* Opção padrão se houver clientes */}
                                    {clients.length > 0 && <option value="">Criar Novo Cliente</option>}
                        
                                    {/* Listagem dos clientes existentes */}
                                    {clients.map((client) => (
                                        <option key={client.id} value={client.id}>
                                            {client.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            {selectedClient === '' && (
                                <div className="mb-4">
                                    <h2 className="text-lg font-semibold">Ou Crie um Novo Cliente:</h2>
                                    <div className="mb-4">
                                        <label className="block mb-1">Nome:</label>
                                        <input type="text" value={newClient.name} onChange={(e) => setNewClient({ ...newClient, name: e.target.value })} className="border p-2 w-full" required/>
                                    </div>
                                    <div className="mb-4">
                                        <label className="block mb-1">Telefone:</label>
                                        <input type="text" value={newClient.phone} onChange={(e) => setNewClient({ ...newClient, phone: e.target.value })} className="border p-2 w-full" required/>
                                    </div>
                                    <div className="mb-4">
                                        <label className="block mb-1">Email:</label>
                                        <input type="email" value={newClient.email} onChange={(e) => setNewClient({ ...newClient, email: e.target.value })} className="border p-2 w-full" />
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                    <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded">
                        Adicionar Carro
                    </button>
                </form>
            </div>
        </div>
    );
};

export default AddCar;
