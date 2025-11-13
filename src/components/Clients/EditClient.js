import React, { useEffect, useState } from 'react';
import { db } from '../../firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { useParams, useNavigate } from 'react-router-dom';
import Navbar2 from '../Navbar';

const EditClient = () => {
    const { id } = useParams(); // Pega o ID do cliente da URL
    const [name, setName] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [email, setEmail] = useState('');

    const navigate = useNavigate();

    useEffect(() => {
        const fetchClient = async () => {
            const docRef = doc(db, 'clients', id);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                const clientData = docSnap.data();
                setName(clientData.name);
                setPhoneNumber(clientData.phone); // Corrigido para 'phone'
                setEmail(clientData.email);
            } else {
                console.log("Nenhum documento encontrado!");
            }
        };

        fetchClient();
    }, [id]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const docRef = doc(db, 'clients', id);

            // Formatar a data e hora atuais em dd/mm/yyyy HH:MM
            const now = new Date();
            const formattedDate = `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

            await updateDoc(docRef, {
                name,
                phone: phoneNumber, // Corrigido para 'phone'
                email,
                date: formattedDate, // Usa a data formatada
            });
            console.log("Cliente atualizado com ID: ", id);
            navigate('/'); // Redirecionar para a página dos clientes
        } catch (error) {
            console.error("Erro ao atualizar cliente: ", error);
        }
    };

    return (
        <div className="h-screen">
            <Navbar2 />
            <div className="container mx-auto p-4">
                <h1 className="text-2xl mb-4">Editar Cliente</h1>
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
                        required
                    />
                    <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded">Atualizar Cliente</button>
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

export default EditClient;