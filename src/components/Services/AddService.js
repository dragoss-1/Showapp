import React, { useState, useEffect } from 'react';
import Navbar from '../Navbar';
import { db } from '../../firebase';
import { collection, getDocs, query, where, doc, getDoc, setDoc} from 'firebase/firestore';
import { useNavigate, useParams } from 'react-router-dom';

const AddService = () => {
    const { id: carId } = useParams();
    const navigate = useNavigate();
    const [date, setDate] = useState(() => {
        const today = new Date().toISOString().split('T')[0]; // Formata para YYYY-MM-DD
        return today;
    });
    const [description, setDescription] = useState('');
    const [status, setStatus] = useState('in_progress'); // Padrão: "Em execução"
    const [paid, setPaid] = useState(false); // Padrão: "Por pagar"
    const [existingCodes, setExistingCodes] = useState([]); // Lista de códigos existentes
    const [selectedClient, setSelectedClient] = useState('');
    const [selectedCar, setSelectedCar] = useState('');
    const [clients, setClients] = useState([]);
    const [cars, setCars] = useState([]);
    const [selectedCodigos, setSelectedCodigos] = useState(['']); // Começa com um campo vazio
    const [selectedTypes, setSelectedTypes] = useState([]);
    const [selectedCosts, setSelectedCosts] = useState([]);
    const [cost, setCost] = useState('');
    const [items, setItems] = useState([{ name: "", price: "" }]);
    const [kmAtual, setKmAtual] = useState("N/A"); // Guarda a quilometragem original
    const [km, setKm] = useState(""); // Usado para entrada no input

    useEffect(() => {
        if (carId !== "0") {
            setSelectedCar(carId);
        }
    }, [carId]);

        // Buscar os clientes do Firestore
        useEffect(() => {
            const fetchClients = async () => {
                try {
                    const clientsCollection = collection(db, 'clients');
                    const clientsSnapshot = await getDocs(clientsCollection);
                    const clientsData = clientsSnapshot.docs.map(doc => ({
                        id: doc.id,
                        name: doc.data().name,
                    }));
                    setClients(clientsData);
                } catch (error) {
                    console.error('Erro ao buscar clientes:', error);
                }
            };
    
            fetchClients();
        }, []);
    
        // Buscar os carros do cliente selecionado
        useEffect(() => {
            if (!selectedClient) return;
    
            const fetchCars = async () => {
                try {
                    const carsCollection = collection(db, 'cars');
                    const carsQuery = query(carsCollection, where('clientId', '==', selectedClient));
                    const carsSnapshot = await getDocs(carsQuery);
                    const carsData = carsSnapshot.docs.map(doc => ({
                        id: doc.id,
                        name: doc.data().name,
                    }));
                    setCars(carsData);
                } catch (error) {
                    console.error('Erro ao buscar carros:', error);
                }
            };
    
            fetchCars();
        }, [selectedClient]);

        useEffect(() => {
            if (!selectedCar) return;
        
            const normalizeKm = (kmString) => {
                if (!kmString) return null;
                return parseInt(kmString.toString().replace(/\s+/g, '').replace(/[.,]/g, ''), 10) || null;
            };
        
            const fetchKm = async () => {
                try {
                    let carKm = null;
                    let maxServiceKm = null;
        
                    // 1. Buscar o maior km dos serviços desse carro
                    const servicesCollection = collection(db, 'services');
                    const servicesQuery = query(servicesCollection, where('carId', '==', selectedCar));
                    const servicesSnapshot = await getDocs(servicesQuery);
        
                    if (!servicesSnapshot.empty) {
                        maxServiceKm = Math.max(...servicesSnapshot.docs.map(doc => normalizeKm(doc.data().km)));
                    }
        
                    // 2. Se não houver serviços com km, buscar o km do carro
                    if (!maxServiceKm || maxServiceKm === 0) {
                        const carDocRef = doc(db, 'cars', selectedCar);
                        const carDocSnap = await getDoc(carDocRef);
        
                        if (carDocSnap.exists()) {
                            carKm = normalizeKm(carDocSnap.data().km);
                        }
                    }
        
                    // 3. Definir a quilometragem original
                    if (maxServiceKm) {
                        setKmAtual(maxServiceKm); // Usa o maior km dos serviços
                    } else if (carKm) {
                        setKmAtual(carKm); // Usa o km do carro se não houver serviços
                    } else {
                        setKmAtual("N/A"); // Se não houver nada, exibe "N/A"
                    }
                } catch (error) {
                    console.error('Erro ao buscar quilometragem:', error);
                    setKmAtual("N/A"); // Se houver erro, exibir "N/A"
                }
            };
        
            fetchKm();
        }, [selectedCar]);        
    
        // Buscar os códigos existentes do Firebase
        useEffect(() => {
            const fetchExistingCodes = async () => {
                try {
                    const codesCollection = collection(db, 'codigos');
                    const codesSnapshot = await getDocs(codesCollection);
                    const codes = codesSnapshot.docs.map(doc => ({
                        id: doc.id,
                        codigo: doc.data().codigo,
                        funcao: doc.data().funcao,
                        preco: doc.data().preco,
                    }));
                    setExistingCodes(codes);
                } catch (error) {
                    console.error('Erro ao buscar códigos existentes: ', error);
                }
            };
    
            fetchExistingCodes();
        }, []);
        
        // Adicionar um novo campo para código, tipo e custo
        const addCodigoField = () => {
            setSelectedCodigos([...selectedCodigos, '']);
            setSelectedTypes([...selectedTypes, '']);
            setSelectedCosts([...selectedCosts, 0]); // Adiciona custo 0 por padrão
        };
        const removeCodigoField = (index) => {
            setSelectedCodigos(selectedCodigos.filter((_, i) => i !== index));
            setSelectedTypes(selectedTypes.filter((_, i) => i !== index));
            setSelectedCosts(selectedCosts.filter((_, i) => i !== index));
        };

        const handleSubmit = async (e) => {
            e.preventDefault();

            try {
                const isFinalized = status === 'completed' && paid === true;
                const targetCollectionName = isFinalized ? 'archived_services' : 'services';

                // Gera uma referência com ID único
                const serviceDocRef = doc(collection(db, targetCollectionName));
                const newServiceId = serviceDocRef.id;
                const allServicesDocRef = doc(db, 'allservices', newServiceId);
                // Atualiza os tipos com base nos códigos
                const updatedTypes = selectedCodigos.map((codigo, index) => 
                codigo 
                    ? (existingCodes.find(service => service.codigo === codigo)?.funcao || "")
                    : selectedTypes[index]
                );

                // Coleta descrições e preços das compras
                const purchaseDescriptions = items.map(item => item.name || "");
                const purchasePrices = items.map(item => parseFloat(item.price) || 0);

                // Monta o novo serviço
                const newService = {
                id: newServiceId,
                carId: selectedCar,
                codigo: selectedCodigos,
                type: updatedTypes,
                date,
                km: km || null,
                description,
                costs: selectedCosts,
                status,
                paid,
                purchases: purchaseDescriptions.length > 0 ? purchaseDescriptions : null,
                purchasesprice: purchasePrices.length > 0 ? purchasePrices : null,
                totalCost: parseFloat(cost) || calculatedTotalCost,
                };

                // Salva nas duas coleções com o mesmo ID
                await setDoc(serviceDocRef, newService);
                await setDoc(allServicesDocRef, newService);

                // Redireciona para a página do carro
                navigate(`/car-services/${selectedCar}`);
            } catch (error) {
                console.error("Erro ao adicionar serviço:", error);
            }
            };
        
        // Atualiza o item de compra (sem quantidade)
        const handleItemChange = (index, field, value) => {
            const updatedItems = [...items];
            updatedItems[index][field] = field === "price" ? parseFloat(value) || "" : value;
            setItems(updatedItems);
            };
        
        // Calcula o custo total (evita valores vazios e NaN)
        const calculatedTotalCost =
            selectedCosts.reduce((acc, cost) => acc + (parseFloat(cost) || 0), 0) +
            (parseFloat(items[0]?.price) || 0);        

    return (
        <div className="h-screen">
            <Navbar />
            <div className="container mx-auto p-4">
                <h1 className="text-2xl font-bold mb-4">Adicionar Serviço</h1>
                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Selecionar Cliente */}
                    {carId === "0" && (
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700">Cliente</label>
                            <select
                                value={selectedClient}
                                onChange={(e) => setSelectedClient(e.target.value)}
                                className="mt-1 block w-full border border-gray-300 rounded px-3 py-2"
                                required
                            >
                                <option value="">Selecione um cliente</option>
                                {clients.map(client => (
                                    <option key={client.id} value={client.id}>{client.name}</option>
                                ))}
                            </select>
                        </div>
                    )}
    
                    {/* Selecionar Carro */}
                    {selectedClient && (
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700">Carro</label>
                            <select
                                value={selectedCar}
                                onChange={(e) => setSelectedCar(e.target.value)}
                                className="mt-1 block w-full border border-gray-300 rounded px-3 py-2"
                                required
                            >
                                <option value="">Selecione um carro</option>
                                {cars.map(car => (
                                    <option key={car.id} value={car.id}>{car.name}</option>
                                ))}
                            </select>
                        </div>
                    )}

                    <div className="mb-4">
                        <label className="block mb-1">Novos Kms:</label>
                        <span className="text-gray-600 text-sm">Atual: {kmAtual}</span>
                        <input 
                            type="text" 
                            value={km} // km separado da quilometragem original
                            onChange={(e) => setKm(e.target.value.replace(/\s+/g, '').replace(/[.,]/g, ''))} 
                            className="border p-2 w-full mt-1" 
                            placeholder={kmAtual === "N/A" ? "Insira a quilometragem" : ""}
                        />
                    </div>

                    {/* Campos de Serviço */}
                    <div>
                    <h2 className="text-xl font-semibold mt-4">Serviços</h2>
                    {selectedCodigos.map((codigo, index) => (
                <div key={index} className="mb-2 border-2 border-blue-500 p-3 rounded-lg shadow-sm">
                    {/* Selecione um código ou digite um serviço, não ambos */}
                    {!selectedTypes[index] && (
                        <>
                            <label className="block text-sm font-medium text-gray-700">
                                Código do Serviço
                            </label>
                            <select
                                value={codigo}
                                onChange={(e) => {
                                    const value = e.target.value;
                                    setSelectedCodigos((prev) => {
                                        const updated = [...prev];
                                        updated[index] = value;
                                        return updated;
                                    });

                                    // Define preço automaticamente
                                    const selectedService = existingCodes.find(
                                        (service) => service.codigo === value
                                    );

                                    setSelectedCosts((prev) => {
                                        const updated = [...prev];
                                        updated[index] = selectedService ? parseFloat(selectedService.preco) : 0;
                                        return updated;
                                    });

                                    // Remove o input de serviço se selecionar um código
                                    setSelectedTypes((prev) => {
                                        const updated = [...prev];
                                        updated[index] = "";
                                        return updated;
                                    });
                                }}
                                className={`mt-1 block w-full border border-gray-300 rounded px-3 py-2 ${
                                    codigo ? "text-green-600 font-semibold" : "text-gray-700"
                                }`}
                            >
                                <option value="">Selecionar Código...</option>
                                {existingCodes
                                    .slice()
                                    .sort((a, b) => parseInt(a.codigo, 10) - parseInt(b.codigo, 10))
                                    .map((service) => (
                                        <option key={service.id} value={service.codigo}>
                                            {service.codigo} - {service.funcao}
                                        </option>
                                    ))}
                            </select>
                        </>
                    )}

                    {!selectedCodigos[index] && (
                        <>
                            <label className="block text-sm font-medium text-gray-700 mt-2">Serviço</label>
                            <input
                                type="text"
                                value={selectedTypes[index] || ""}
                                onChange={(e) => {
                                    const value = e.target.value;

                                    setSelectedTypes((prev) => {
                                        const updated = [...prev];
                                        updated[index] = value;
                                        return updated;
                                    });

                                    // Remove o select de código se começar a digitar um serviço
                                    setSelectedCodigos((prev) => {
                                        const updated = [...prev];
                                        updated[index] = "";
                                        return updated;
                                    });
                                }}
                                className="mt-1 block w-full border border-gray-300 rounded px-3 py-2"
                            />
                        </>
                    )}

                    <label className="block text-sm font-medium text-gray-700 mt-2">Custo (€)</label>
                    <input
                        type="number"
                        step="0.01"
                        value={selectedCosts[index] || ""}
                        onChange={(e) => {
                            const value = parseFloat(e.target.value) || 0;
                            setSelectedCosts((prev) => {
                                const updated = [...prev];
                                updated[index] = value;
                                return updated;
                            });
                        }}
                        className="mt-1 block w-full border border-gray-300 rounded px-3 py-2"
                    />

                    <div className="flex gap-2 mt-2">
                        {index === selectedCodigos.length - 1 && (
                            <button
                                type="button"
                                onClick={addCodigoField}
                                className="bg-gray-300 text-gray-700 px-2 py-1 rounded-full text-sm border border-gray-400"
                            >
                                Adicionar +
                            </button>
                        )}
                        {selectedCodigos.length > 1 && (
                            <button
                                type="button"
                                onClick={() => removeCodigoField(index)}
                                className="bg-red-500 text-white px-2 py-1 rounded-full text-sm border border-red-700"
                            >
                                Remover
                            </button>
                        )}
                    </div>
                </div>
            ))}

                        <h2 className="text-xl font-semibold mt-4">Itens</h2>
                        <div className="mb-2 border-2 border-yellow-400 p-3 rounded-lg shadow-sm">
                            <label className="block text-sm font-medium text-gray-700">Peças/Serviços de terceiros</label>
                            <textarea
                                value={items[0]?.name || ""}
                                onChange={(e) => handleItemChange(0, "name", e.target.value)}
                                className="mt-1 block w-full border border-gray-300 rounded px-3 py-2"
                                rows="2"
                            ></textarea>

                            <label className="block text-sm font-medium text-gray-700 mt-2">Preço (€)</label>
                            <input
                                type="number"
                                step="0.01"
                                value={items[0]?.price || ""}
                                onChange={(e) => handleItemChange(0, "price", e.target.value)}
                                className="mt-1 block w-full border border-gray-300 rounded px-3 py-2"
                            />
                        </div>

                                {/* Exibição do total calculado automaticamente */}
                                <label className="block text-sm font-medium text-gray-700">Soma dos Custos (€)</label>
                                <p className="text-lg font-semibold text-gray-700">
                                    {selectedCosts.filter(cost => cost > 0).join(" + ") || "0 + "} 
                                    {selectedCosts.length > 0 && items.length > 0 ? " + " : ""} 
                                    {items.length > 0 
                                        ? items.map(item => item.price ? `${parseFloat(item.price)}` : "0").join(" + ") 
                                        : "0"} 
                                    {" €"}
                                </p>

                                {/* Campo editável para o custo final */}
                                <label className="block text-sm font-medium text-gray-700 mt-2">Custo Final (€)</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={cost !== '' ? cost : calculatedTotalCost.toFixed(2)}
                                    onChange={(e) => {
                                        const value = e.target.value;
                                        setCost(value === '' ? '' : parseFloat(value));
                                    }}
                                    onBlur={() => {
                                        if (cost === '') {
                                            setCost(calculatedTotalCost.toFixed(2)); // Se o campo estiver vazio, repõe o custo total
                                        }
                                    }}
                                    className="mt-1 block w-full border border-gray-300 rounded px-3 py-2 font-medium text-green-600"
                                />
                    </div>
    
                    {/* Data */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Data</label>
                        <input
                            type="date"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            className="mt-1 block w-full border border-gray-300 rounded px-3 py-2"
                            required
                        />
                    </div>
    
                    {/* Descrição */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Descrição</label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="mt-1 block w-full border border-gray-300 rounded px-3 py-2"
                            rows="3"
                        ></textarea>
                    </div>
    
                    {/* Status */}
                    <div className="flex items-center">
                        <input
                            type="checkbox"
                            checked={status === 'completed'}
                            onChange={() => setStatus(status === 'completed' ? 'in_progress' : 'completed')}
                            className="mr-2"
                        />
                        <label className="text-sm font-medium">
                            {status === 'completed' ? 'Finalizado ✔️' : 'Em execução ⏳'}
                        </label>
                    </div>
    
                    {/* Pago */}
                    <div className="flex items-center">
                        <input
                            type="checkbox"
                            checked={paid}
                            onChange={() => setPaid(!paid)}
                            className="mr-2"
                        />
                        <label className="text-sm font-medium">
                            {paid ? 'Pago ✔️' : 'Por pagar ❌'}
                        </label>
                    </div>
    
                    {/* Botão de submissão */}
                    <div>
                        <button type="submit" className="bg-green-500 text-white px-4 py-2 rounded">
                            Adicionar Serviço
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );    
};

export default AddService;