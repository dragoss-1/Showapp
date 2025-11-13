import React, { useEffect, useState } from 'react';
import Navbar from '../Navbar';
import { db } from '../../firebase';
import { doc, getDoc, updateDoc,collection, query, where, getDocs, writeBatch } from 'firebase/firestore';
import { useNavigate, useParams } from 'react-router-dom';

const EditCode = () => {
    const { id } = useParams();
    const [codigo, setCodigo] = useState('');
    const [funcao, setFuncao] = useState('');
    const [preco, setPreco] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        const fetchCodigo = async () => {
            try {
                const docRef = doc(db, 'codigos', id);
                const docSnap = await getDoc(docRef);

                if (docSnap.exists()) {
                    const data = docSnap.data();
                    setCodigo(data.codigo || '');
                    setFuncao(data.funcao || '');
                    setPreco(data.preco ? data.preco.toString() : '');
                } else {
                    setError('Código não encontrado.');
                }
            } catch (error) {
                console.error('Erro ao carregar código:', error);
                setError('Erro ao carregar os dados.');
            }
        };

        fetchCodigo();
    }, [id]);

    const handleUpdate = async (e) => {
        e.preventDefault();
        setError('');
    
        console.log('Tentando atualizar:', { codigo, funcao, preco });
    
        if (!codigo?.trim() || !funcao?.trim() || !preco?.trim()) {
            setError('Preencha todos os campos.');
            return;
        }
    
        if (isNaN(preco) || Number(preco) < 0) {
            setError('O preço deve ser um número positivo.');
            return;
        }
    
        try {
            const docRef = doc(db, 'codigos', id);
            const docSnap = await getDoc(docRef);
    
            if (!docSnap.exists()) {
                setError('Código não encontrado.');
                return;
            }
    
            const oldCodigo = docSnap.data().codigo; // Captura o código antigo
    
            // Verifica se o novo código já existe (excluindo o atual)
            const q = query(collection(db, 'codigos'), where('codigo', '==', codigo));
            const querySnapshot = await getDocs(q);
    
            if (!querySnapshot.empty) {
                const codigoExistente = querySnapshot.docs.find(doc => doc.id !== id);
                if (codigoExistente) {
                    setError(`O código "${codigo}" já está em uso.`);
                    return;
                }
            }
    
            // Atualiza o código na coleção "codigos"
            await updateDoc(docRef, { 
                codigo, 
                funcao, 
                preco: Number(preco) 
            });
    
            console.log(`Código atualizado: ${oldCodigo} -> ${codigo}`);
    
            // Atualiza os serviços associados ao código antigo
            const servicesQuery = query(collection(db, 'services'), where('codigo', '==', oldCodigo));
            const servicesSnapshot = await getDocs(servicesQuery);
            
            const batch = writeBatch(db); // Batch para atualizar múltiplos documentos
    
            servicesSnapshot.forEach(serviceDoc => {
                const serviceRef = doc(db, 'services', serviceDoc.id);
                batch.update(serviceRef, { 
                    codigo, 
                    cost: Number(preco), 
                    type: funcao 
                });
            });
    
            await batch.commit(); // Aplica todas as atualizações de uma vez
    
            console.log(`Atualizados ${servicesSnapshot.size} serviços com o novo código ${codigo}`);
    
            navigate('/codes'); // Redireciona após a atualização
        } catch (error) {
            console.error('Erro ao atualizar código e serviços:', error);
            setError('Erro ao atualizar os dados. Tente novamente.');
        }
    };    

    return (
        <div className="h-screen">
            <Navbar />
            <div className="container mx-auto p-4">
                <h1 className="text-2xl font-bold mb-4">Editar Código</h1>

                {error && <p className="text-red-500">{error}</p>}

                <form onSubmit={handleUpdate}>
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

                    <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded">
                        Salvar Alterações
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

export default EditCode;