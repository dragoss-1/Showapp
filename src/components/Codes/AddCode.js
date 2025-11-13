import React, { useState } from 'react';
import Navbar from '../Navbar';
import { db } from '../../firebase';
import { collection, addDoc, query, where, getDocs } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';

const AddCode = () => {
    const [codigo, setCodigo] = useState('');
    const [funcao, setFuncao] = useState('');
    const [preco, setPreco] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!codigo.trim() || !funcao.trim() || !preco.trim()) {
            setError('Preencha todos os campos.');
            return;
        }

        // Verifica se o preço é um número válido
        if (isNaN(preco) || Number(preco) < 0) {
            setError('O preço deve ser um número positivo.');
            return;
        }

        try {
            // Verificar se o código já existe
            const q = query(collection(db, 'codigos'), where('codigo', '==', codigo));
            const querySnapshot = await getDocs(q);

            if (!querySnapshot.empty) {
                // Pegamos o primeiro resultado (caso existam múltiplos)
                const existingCode = querySnapshot.docs[0].data();
                setError(`O código "${codigo}" já está em uso para: "${existingCode.funcao}".`);
                return;
            }

            // Se não existir, adiciona ao Firestore
            await addDoc(collection(db, 'codigos'), { 
                codigo, 
                funcao, 
                preco: Number(preco) // Armazena o preço como número
            });

            navigate('/codes'); // Redireciona para a lista de códigos após adicionar
        } catch (error) {
            console.error('Erro ao adicionar código:', error);
            setError('Erro ao adicionar código. Tente novamente.');
        }
    };

    return (
        <div className="h-screen">
            <Navbar />
            <div className="container mx-auto p-4">
                <h1 className="text-2xl font-bold mb-4">Adicionar Código</h1>

                {error && <p className="text-red-500">{error}</p>}

                <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                        <label className="block text-gray-700 font-bold mb-2">Código:</label>
                        <input
                            type="text"
                            value={codigo}
                            onChange={(e) => setCodigo(e.target.value)}
                            className="border p-2 w-full"
                            placeholder="Ex: 1"
                        />
                    </div>

                    <div className="mb-4">
                        <label className="block text-gray-700 font-bold mb-2">Função:</label>
                        <input
                            type="text"
                            value={funcao}
                            onChange={(e) => setFuncao(e.target.value)}
                            className="border p-2 w-full"
                            placeholder="Ex: Falha na ignição"
                        />
                    </div>

                    <div className="mb-4">
                        <label className="block text-gray-700 font-bold mb-2">Preço (€):</label>
                        <input
                            type="text"
                            value={preco}
                            onChange={(e) => setPreco(e.target.value)}
                            className="border p-2 w-full"
                            placeholder="Ex: 50"
                        />
                    </div>

                    <button type="submit" className="bg-green-500 text-white px-4 py-2 rounded">
                        Adicionar Código
                    </button>
                </form>

                <button
                    onClick={() => navigate('/codes')}
                    className="mt-4 bg-gray-500 text-white px-4 py-2 rounded"
                >
                    Voltar
                </button>
            </div>
        </div>
    );
};

export default AddCode;