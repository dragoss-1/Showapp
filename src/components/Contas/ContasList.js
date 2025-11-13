import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../Navbar";
import { db } from "../../firebase";
import { collection, getDocs } from "firebase/firestore";

const ContasList = () => {
    const [contasPorCliente, setContasPorCliente] = useState({});
    const [filterClient, setFilterClient] = useState(""); // Estado do filtro
    const navigate = useNavigate();

    useEffect(() => {
        const fetchData = async () => {
            try {
                const clientesSnapshot = await getDocs(collection(db, "clients"));
                const clientesList = clientesSnapshot.docs.map((doc) => ({
                    id: doc.id,
                    ...doc.data(),
                }));

                const carrosSnapshot = await getDocs(collection(db, "cars"));
                const carrosList = carrosSnapshot.docs.map((doc) => ({
                    id: doc.id,
                    ...doc.data(),
                }));

                const servicosSnapshot = await getDocs(collection(db, "services"));
                const servicosList = servicosSnapshot.docs.map((doc) => ({
                    id: doc.id,
                    ...doc.data(),
                }));

                const contasMap = {};
                clientesList.forEach((cliente) => {
                    contasMap[cliente.id] = {
                        id: cliente.id,
                        nome: cliente.name || "N/A",
                        totalDevido: 0,
                    };
                });

                carrosList.forEach((carro) => {
                    if (carro.clientId && contasMap[carro.clientId]) {
                        const servicosCarro = servicosList.filter(servico => servico.carId === carro.id);

                        servicosCarro.forEach(servico => {
                            if (!servico.paid) {
                                contasMap[carro.clientId].totalDevido += servico.totalCost || 0;
                            }
                        });
                    }
                });

                setContasPorCliente(contasMap);
            } catch (error) {
                console.error("Erro ao buscar dados:", error);
            }
        };

        fetchData();
    }, []);

    // Função para normalizar strings (remover acentos)
    const normalizeText = (text) => {
        return text
            .normalize("NFD") // Decompõe caracteres acentuados
            .replace(/[\u0300-\u036f]/g, "") // Remove os acentos
            .toLowerCase(); // Converte para minúsculas
    };

    return (
        <div className="h-screen">
            <Navbar />
            <div className="container mx-auto p-4">
                <h1 className="text-2xl font-bold mb-4">Contas</h1>

                {/* Input de filtro */}
                <input
                    type="text"
                    placeholder="Filtrar por cliente..."
                    value={filterClient}
                    onChange={(e) => setFilterClient(e.target.value)}
                    className="mb-4 px-3 py-2 border border-gray-300 rounded w-full"
                />

                <table className="min-w-full border border-gray-300 mt-2">
                    <thead>
                        <tr className="bg-gray-200">
                            <th className="border px-4 py-2">Cliente</th>
                            <th className="border px-4 py-2">Por pagar</th>
                            <th className="border px-4 py-2">Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        {Object.values(contasPorCliente)
                            .filter(conta => normalizeText(conta.nome).includes(normalizeText(filterClient))) // Aplica filtro
                            .sort((a, b) => b.totalDevido - a.totalDevido) // Ordena do maior para o menor
                            .map((conta) => (
                                <tr key={conta.id}>
                                    <td className="border px-4 py-2">{conta.nome}</td>
                                    <td 
                                        className={`border px-4 py-2 font-bold ${
                                            conta.totalDevido > 0 ? "text-red-500" : "text-green-500"
                                        }`}
                                    >
                                        {new Intl.NumberFormat("pt-PT", { style: "currency", currency: "EUR" }).format(conta.totalDevido)}
                                    </td>
                                    <td className="border px-4 py-2">
                                        <button
                                            className="bg-blue-500 text-white px-4 py-1 rounded hover:bg-blue-700"
                                            onClick={() => navigate(`/car-services/0?clientId=${conta.id}`)}
                                        >
                                            Ver Serviços
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

export default ContasList;