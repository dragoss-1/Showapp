// src/components/EditCar.js
import React, { useState, useEffect } from 'react';
import { db } from '../../firebase';
import { doc, getDoc, updateDoc, collection, getDocs, addDoc } from 'firebase/firestore';
import { useParams, useNavigate } from 'react-router-dom';
import Navbar from '../Navbar';

const EditCar = () => {
    const { id: carId } = useParams();
    const [car, setCar] = useState({
        name: '',
        year: '',
        vin: '',
        licensePlate: '',
        kms: '',
        clientId: ''
    });
    const [clients, setClients] = useState([]);
    const [selectedClient, setSelectedClient] = useState('');
    const [newClient, setNewClient] = useState({ name: '', phone: '', email: '' });
    const navigate = useNavigate();

    useEffect(() => {
        const fetchCar = async () => {
            const carDoc = doc(db, 'cars', carId);
            const carData = await getDoc(carDoc);
            if (carData.exists()) {
                const carInfo = carData.data();
                setCar({ id: carData.id, ...carInfo, kms: String(carInfo.km || '') });
                setSelectedClient(carInfo.clientId || '');
            } else {
                console.error('Carro não encontrado');
            }
        };

        const fetchClients = async () => {
            const clientsCollection = collection(db, 'clients');
            const clientsSnapshot = await getDocs(clientsCollection);
            const clientsList = clientsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setClients(clientsList);
        };

        fetchCar();
        fetchClients();
    }, [carId]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setCar((prevCar) => ({
            ...prevCar,
            [name]: value
        }));
    };

    const handleClientChange = (e) => {
        setSelectedClient(e.target.value);
    };

    const handleNewClientChange = (e) => {
        const { name, value } = e.target;
        setNewClient((prev) => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            let clientIdToUse = selectedClient;
    
            // Criar um novo cliente se necessário
            if (!selectedClient && newClient.name.trim()) {
                const newClientData = {
                    name: newClient.name.trim(),
                    phone: newClient.phone || "",
                    email: newClient.email || "" // Garante que o email é opcional
                };
                const newClientRef = await addDoc(collection(db, 'clients'), newClientData);
                clientIdToUse = newClientRef.id; // Usa o ID do novo cliente
            }
    
            // Atualizar os dados do carro no Firestore
            const updatedCarData = {
                ...car,
                km: car.kms || null, // Garante que km não seja string vazia
                clientId: clientIdToUse || null
            };
    
            const carDocRef = doc(db, 'cars', carId);
            await updateDoc(carDocRef, updatedCarData);
    
            // Redirecionar para a lista de carros do cliente atualizado
            navigate(`/cars/${clientIdToUse || '0'}`);
        } catch (error) {
            console.error('Erro ao atualizar carro: ', error);
        }
    };

    return (
        <div className="h-screen">
            <Navbar />
            <div className="container mx-auto p-4">
                <h1 className="text-2xl font-bold mb-4">Editar Carro</h1>
                <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                        <label className="block mb-1">Nome do Carro:</label>
                        <input type="text" name="name" value={car.name} onChange={handleChange} className="border p-2 w-full"/>
                    </div>
                    <div className="mb-4">
                        <label className="block mb-1">Ano:</label>
                        <input type="number" name="year" value={car.year} onChange={handleChange} className="border p-2 w-full"/>
                    </div>
                    <div className="mb-4">
                        <label className="block mb-1">Código VIN:</label>
                        <input type="text" name="vin" value={car.vin} onChange={handleChange} className="border p-2 w-full"/>
                    </div>
                    <div className="mb-4">
                        <label className="block mb-1">Matrícula:</label>
                        <input type="text" name="licensePlate" value={car.licensePlate} onChange={handleChange} className="border p-2 w-full"/>
                    </div>
                    <div className="mb-4">
                        <label className="block mb-1">Kms:</label>
                        <input type="text" name="kms" value={car.kms} onChange={handleChange} className="border p-2 w-full"/>
                    </div>
                    <div className="mb-4">
                        <label className="block mb-1">Selecionar Cliente:</label>
                        <select value={selectedClient} onChange={handleClientChange} className="border p-2 w-full">
                            <option value="">Criar cliente</option>
                            {clients.map((client) => (
                                <option key={client.id} value={client.id}>{client.name}</option>
                            ))}
                        </select>
                    </div>
                    {selectedClient === '' && (
                        <div className="mb-4">
                            <h2 className="text-lg font-semibold">Ou Crie um Novo Cliente:</h2>
                            <label className="block mb-1">Nome:</label>
                            <input type="text" name="name" value={newClient.name} onChange={handleNewClientChange} className="border p-2 w-full mb-2" required/>
                            <label className="block mb-1">Telefone:</label>
                            <input type="text" name="phone" value={newClient.phone} onChange={handleNewClientChange} className="border p-2 w-full mb-2" required/>
                            <label className="block mb-1">Email:</label>
                            <input type="email" name="email" value={newClient.email} onChange={handleNewClientChange} className="border p-2 w-full" />
                        </div>
                    )}
                    <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded">Salvar Alterações</button>
                </form>
            </div>
        </div>
    );
};

export default EditCar;