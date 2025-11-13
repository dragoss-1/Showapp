import React, { useState } from 'react';
import { db } from '../../firebase'; // Certifique-se de que o caminho para o Firebase está correto
import { collection, addDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom'; // Importa o hook useNavigate
import Navbar2 from '../Navbar'; // Importar a Navbar

const AddClient = () => {
    const [name, setName] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [email, setEmail] = useState('');

    const navigate = useNavigate(); // Inicializa o useNavigate

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            // Formatar a data e hora atuais em dd/mm/yyyy HH:MM
            const now = new Date();
            const formattedDate = `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

            const docRef = await addDoc(collection(db, 'clients'), {
                name,
                phone: phoneNumber,
                email,
                date: formattedDate, // Usa a data formatada
            });
            console.log("Cliente adicionado com ID: ", docRef.id);
            // Limpar o formulário após a adição
            setName('');
            setPhoneNumber('');
            setEmail('');

            // Redirecionar para a página de clientes
            navigate('/'); // Redireciona para a página dos clientes
        } catch (error) {
            console.error("Erro ao adicionar cliente: ", error);
        }
    };

    return (
        <div className="h-screen">
            <Navbar2 />
            <div className="container mx-auto p-4">
                <h1 className="text-2xl mb-4">Adicionar Novo Cliente</h1>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <input 
                        type="text" 
                        placeholder="Nome Completo" 
                        value={name} 
                        onChange={(e) => setName(e.target.value)} 
                        className="border p-2 w-full"
                        required
                    />
                    <input 
                        type="text" 
                        placeholder="Número de Telefone" 
                        value={phoneNumber} 
                        onChange={(e) => setPhoneNumber(e.target.value)} 
                        className="border p-2 w-full"
                        required
                    />
                    <input 
                        type="email" 
                        placeholder="Email" 
                        value={email} 
                        onChange={(e) => setEmail(e.target.value)} 
                        className="border p-2 w-full"
                    />
                    <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded">Adicionar Cliente</button>
                </form>
                <button
                    onClick={() => navigate('/')}
                    className="mt-4 bg-gray-500 text-white px-4 py-2 rounded"
                >
                    Voltar
                </button>
            </div>
        </div>
    );
};

export default AddClient;