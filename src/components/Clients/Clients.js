import React, { useState, useEffect } from 'react';
import Navbar from '../Navbar'; // Importa a Navbar
import { db } from '../../firebase'; // Importa o Firestore
import { collection, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { Link } from 'react-router-dom';

const Clients = () => {
    const [clients, setClients] = useState([]);
    const [filters, setFilters] = useState({
        name: '',
        phone: '',
        email: ''
    });

    useEffect(() => {
        const fetchClients = async () => {
            try {
                const clientsCollection = collection(db, 'clients');
                const clientsSnapshot = await getDocs(clientsCollection);
    
                const clientsList = clientsSnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
    
                setClients(clientsList);
            } catch (error) {
                console.error("Erro ao buscar clientes:", error);
            }
        };
    
        fetchClients();
    }, []);    

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters(prevFilters => ({ ...prevFilters, [name]: value }));
    };

    const handleClearFilters = () => {
        setFilters({
            name: '',
            phone: '',
            email: ''
        });
    };

    const handleDelete = async (id, name) => {
        if (window.confirm(`Deseja excluir o cliente "${name}" e todos os seus carros?`)) {
            try {
                // Referência à coleção de carros
                const carsCollection = collection(db, 'cars');
                const carsSnapshot = await getDocs(carsCollection);
                
                // Filtra os carros associados ao cliente
                const clientCars = carsSnapshot.docs.filter(doc => doc.data().clientId === id);
                
                // Apaga todos os carros do cliente
                const deleteCarPromises = clientCars.map(car => deleteDoc(doc(db, 'cars', car.id)));
                await Promise.all(deleteCarPromises);
    
                // Apaga o cliente
                const clientDoc = doc(db, 'clients', id);
                await deleteDoc(clientDoc);
    
                // Atualiza a lista de clientes no estado
                setClients(clients.filter(client => client.id !== id));
    
                console.log(`Cliente "${name}" e seus carros foram excluídos.`);
            } catch (error) {
                console.error("Erro ao excluir cliente e carros: ", error);
            }
        }
    };    

    const filteredClients = clients.filter(client => {
        return (
            (client.name && client.name.toLowerCase().includes(filters.name.toLowerCase())) &&
            (client.phone && client.phone.includes(filters.phone)) &&
            (!filters.email || (client.email && client.email.toLowerCase().includes(filters.email.toLowerCase())))
        );
    });

    return (
        <div className="h-screen">
            <Navbar />

            <div className="container mx-auto p-4">
                <h1 className="text-2xl font-bold mb-4">Todos os Clientes</h1>
                {/* Filtros */}
                <div className="mb-4">
                    <input
                        type="text"
                        name="name"
                        placeholder="Nome"
                        value={filters.name}
                        onChange={handleFilterChange}
                        className="border p-2 mr-2"
                    />
                    <input
                        type="text"
                        name="phone"
                        placeholder="Telefone"
                        value={filters.phone}
                        onChange={handleFilterChange}
                        className="border p-2 mr-2"
                    />
                    <input
                        type="text"
                        name="email"
                        placeholder="Email"
                        value={filters.email}
                        onChange={handleFilterChange}
                        className="border p-2 mr-2"
                    />
                    <button
                        onClick={handleClearFilters}
                        className="bg-red-500 hover:bg-red-600 text-white py-2 px-4 rounded"
                    >
                        Limpar Filtros
                    </button>
                </div>
                {/* Botão para adicionar novo cliente */}
                <Link to="/add-client" className="bg-green-500 text-white px-4 py-2 rounded mb-4 inline-block">
                    Adicionar Novo Cliente
                </Link>
                {/* Tabela de Clientes */}
                <table className="min-w-full border border-gray-300">
                    <thead>
                        <tr className="bg-gray-200">
                            <th className="border px-4 py-2">Nome</th>
                            <th className="border px-4 py-2">Telefone</th>
                            <th className="border px-4 py-2">Email</th>
                            <th className="border px-4 py-2">Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredClients.map((client) => (
                            <tr key={client.id}>
                                <td className="border px-4 py-2">{client.name || 'N/A'}</td>
                                <td className="border px-4 py-2">{client.phone || 'N/A'}</td>
                                <td className="border px-4 py-2">{client.email || 'N/A'}</td>
                                <td className="border px-4 py-2 text-center">
                                    <Link to={`/cars/${client.id}`} className="bg-blue-500 text-white px-2 py-1 rounded mr-2">
                                        + info
                                    </Link>
                                    <Link to={`/edit/${client.id}`} className="bg-yellow-500 text-white px-2 py-1 rounded mr-2">
                                        Editar
                                    </Link>
                                    <button
                                        onClick={() => handleDelete(client.id, client.name)}
                                        className="bg-red-500 text-white px-2 py-1 rounded"
                                    >
                                        Excluir
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default Clients;