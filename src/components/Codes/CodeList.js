import React, { useEffect, useState } from 'react';
import Navbar from '../Navbar';
import { db } from '../../firebase';
import { collection, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';

const CodeList = () => {
    const [codigos, setCodigos] = useState([]);
    const [filteredCodigos, setFilteredCodigos] = useState([]);
    const [searchCodigo, setSearchCodigo] = useState('');
    const [searchFuncao, setSearchFuncao] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        const fetchCodigos = async () => {
            try {
                const codigosSnapshot = await getDocs(collection(db, 'codigos'));
                const codigosList = codigosSnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data(),
                }));

                // Ordena os códigos de forma crescente
                const sortedCodigos = codigosList.sort((a, b) => Number(a.codigo) - Number(b.codigo));
                setCodigos(sortedCodigos);
                setFilteredCodigos(sortedCodigos);
            } catch (error) {
                console.error('Erro ao buscar códigos:', error);
            }
        };

        fetchCodigos();
    }, []);

    const handleDelete = async (id, code) => {
        if (window.confirm(`Deseja excluir o código "${code}"?`)) {
        try {
            await deleteDoc(doc(db, 'codigos', id));
            const updatedCodigos = codigos.filter(codigo => codigo.id !== id);
            setCodigos(updatedCodigos);
            setFilteredCodigos(updatedCodigos);
        } catch (error) {
            console.error('Erro ao excluir código:', error);
        }
    }
    };

    // Filtro para código e função
    useEffect(() => {
        const filtered = codigos.filter(codigo => 
            codigo.codigo.toString().includes(searchCodigo) &&
            codigo.funcao.toLowerCase().includes(searchFuncao.toLowerCase())
        );
        setFilteredCodigos(filtered);
    }, [searchCodigo, searchFuncao, codigos]);

    // Função para limpar os filtros
    const handleClearFilters = () => {
        setSearchCodigo('');
        setSearchFuncao('');
    };

    return (
        <div className="h-screen">
            <Navbar />
            <div className="container mx-auto p-4">
                <h1 className="text-2xl font-bold mb-4">Todos os Códigos</h1>

                {/* Filtros */}
                <div className="flex flex-wrap gap-4 mb-4">
                    <input
                        type="text"
                        value={searchCodigo}
                        onChange={(e) => setSearchCodigo(e.target.value)}
                        className="border p-2"
                        placeholder="Filtrar por código"
                    />
                    <input
                        type="text"
                        value={searchFuncao}
                        onChange={(e) => setSearchFuncao(e.target.value)}
                        className="border p-2"
                        placeholder="Filtrar por função"
                    />
                    <button
                        onClick={handleClearFilters}
                        className="bg-red-500 hover:bg-red-600 text-white py-2 px-4 rounded"
                    >
                        Limpar Filtros
                    </button>
                </div>

                {/* Botão para adicionar novo código */}
                <button
                    onClick={() => navigate('/add-codigo')}
                    className="bg-green-500 text-white px-4 py-2 rounded mb-4"
                >
                    Adicionar Código
                </button>

                {/* Tabela de códigos */}
                <table className="min-w-full border border-gray-300 mt-4">
                    <thead>
                        <tr className="bg-gray-200">
                            <th className="border px-4 py-2">Código</th>
                            <th className="border px-4 py-2">Função</th>
                            <th className="border px-4 py-2">Preço</th>
                            <th className="border px-4 py-2">Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredCodigos.length > 0 ? (
                            filteredCodigos.map((codigo) => (
                                <tr key={codigo.id}>
                                    <td className="border px-4 py-2">{codigo.codigo}</td>
                                    <td className="border px-4 py-2">{codigo.funcao}</td>
                                    <td className="border px-4 py-2">{codigo.preco ? `${codigo.preco}€` : 'N/A'}</td>
                                    <td className="border px-4 py-2 text-center">
                                        <button
                                            onClick={() => navigate(`/edit-codigo/${codigo.id}`)}
                                            className="bg-yellow-500 text-white px-2 py-1 rounded mr-2"
                                        >
                                            Editar
                                        </button>
                                        <button
                                            onClick={() => handleDelete(codigo.id, codigo.codigo)}
                                            className="bg-red-500 text-white px-2 py-1 rounded"
                                        >
                                            Excluir
                                        </button>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="4" className="border px-4 py-2 text-center">
                                    Nenhum código encontrado.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default CodeList;