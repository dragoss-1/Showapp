import React, { useState, useEffect } from 'react';
import Navbar from '../Navbar';
import { db } from '../../firebase';
import { doc, getDoc, updateDoc, collection, getDocs, query, where, setDoc, deleteDoc } from 'firebase/firestore';
import { useNavigate, useParams } from 'react-router-dom';

const EditService = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    const [selectedCodigos, setSelectedCodigos] = useState([]);
    const [selectedTypes, setSelectedTypes] = useState([]);
    const [selectedCosts, setSelectedCosts] = useState([]);
    const [date, setDate] = useState('');
    const [description, setDescription] = useState('');
    const [status, setStatus] = useState('in_progress');
    const [paid, setPaid] = useState(false);
    const [selectedClient, setSelectedClient] = useState('');
    const [selectedCar, setSelectedCar] = useState('');
    const [clients, setClients] = useState([]);
    const [cars, setCars] = useState([]);
    const [existingCodes, setExistingCodes] = useState([]);
    const [cost, setCost] = useState('');
    const [items, setItems] = useState([{ name: "", price: "" }]);
    const [previousTotalCost, setPreviousTotalCost] = useState(0);
    const [km, setKm] = useState(""); // Usado para entrada no input

    useEffect(() => {
        const fetchService = async () => {
            try {
                // Tenta buscar em "services"
                let serviceRef = doc(db, 'services', id);
                let serviceSnap = await getDoc(serviceRef);

                // Se não existir, tenta em "archived_services"
                if (!serviceSnap.exists()) {
                    serviceRef = doc(db, 'archived_services', id);
                    serviceSnap = await getDoc(serviceRef);
                }

                if (serviceSnap.exists()) {
                    const serviceData = serviceSnap.data();
                    setPreviousTotalCost(serviceData.totalCost ?? 0);
                    setSelectedCar(serviceData.carId);
                    setSelectedCodigos(
                        Array.isArray(serviceData.codigo) ? serviceData.codigo : [serviceData.codigo]
                    );
                    setSelectedTypes(serviceData.type || []);
                    setSelectedCosts(serviceData.costs || []);
                    setDate(serviceData.date);
                    setDescription(serviceData.description);
                    setStatus(serviceData.status);
                    setPaid(serviceData.paid);
                    setCost(serviceData.totalCost ?? 0);

                    const mappedItems = (serviceData.purchases || []).map((name, i) => ({
                        name,
                        price: serviceData.purchasesprice?.[i] || 0,
                    }));

                    setItems(mappedItems.length > 0 ? mappedItems : [{ name: "", price: "" }]);
                } else {
                    console.warn("Serviço não encontrado em nenhuma coleção.");
                }
            } catch (error) {
                console.error("Erro ao buscar serviço:", error);
            }
        };

        fetchService();
    }, [id]);

    useEffect(() => {
        if (!selectedCar) return;
    
        const fetchClientByCar = async () => {
            try {
                const carRef = doc(db, 'cars', selectedCar);
                const carSnap = await getDoc(carRef);
                if (carSnap.exists()) {
                    setSelectedClient(carSnap.data().clientId);
                }
            } catch (error) {
                console.error('Erro ao buscar cliente do carro:', error);
            }
        };
    
        fetchClientByCar();
    }, [selectedCar]);  

    useEffect(() => {
        const fetchClients = async () => {
            try {
                const clientsSnapshot = await getDocs(collection(db, 'clients'));
                const clientsData = clientsSnapshot.docs.map(doc => ({
                    id: doc.id,
                    name: doc.data().name
                }));
    
                setClients(clientsData);
            } catch (error) {
                console.error('Erro ao buscar clientes:', error);
            }
        };
    
        fetchClients();
    }, []);

    useEffect(() => {
        if (!selectedClient) return;
        
        const fetchCars = async () => {
            try {
                const carsQuery = query(collection(db, 'cars'), where('clientId', '==', selectedClient));
                const carsSnapshot = await getDocs(carsQuery);
                setCars(carsSnapshot.docs.map(doc => ({ id: doc.id, name: doc.data().name })));
            } catch (error) {
                console.error('Erro ao buscar carros:', error);
            }
        };

        fetchCars();
    }, [selectedClient]);

    useEffect(() => {
        const fetchExistingCodes = async () => {
            try {
                const codesSnapshot = await getDocs(collection(db, 'codigos'));
                setExistingCodes(codesSnapshot.docs.map(doc => ({ id: doc.id, codigo: doc.data().codigo, funcao: doc.data().funcao, preco: doc.data().preco })));
            } catch (error) {
                console.error('Erro ao buscar códigos existentes:', error);
            }
        };

        fetchExistingCodes();
    }, []);

        useEffect(() => {
        if (!id) return;

        const fetchServiceData = async () => {
            try {
                let serviceRef = doc(db, 'services', id);
                let serviceSnap = await getDoc(serviceRef);

                // Se não encontrar nos serviços, tenta nos arquivados
                if (!serviceSnap.exists()) {
                    serviceRef = doc(db, 'archived_services', id);
                    serviceSnap = await getDoc(serviceRef);
                }

                if (serviceSnap.exists()) {
                    const serviceData = serviceSnap.data();
                    setKm(
                        serviceData.km
                            ? serviceData.km.toString().replace(/\s+/g, '').replace(/[.,]/g, '')
                            : ""
                    );
                }
            } catch (error) {
                console.error("Erro ao buscar os dados do serviço:", error);
            }
        };

        fetchServiceData();
        }, [id]);

    const addCodigoField = () => {
        setSelectedCodigos([...selectedCodigos, '']);
        setSelectedTypes([...selectedTypes, '']);
        setSelectedCosts([...selectedCosts, 0]);
    };

    const removeCodigoField = (index) => {
        const updatedCodigos = [...selectedCodigos];
        const updatedTypes = [...selectedTypes];
        const updatedCosts = [...selectedCosts];
        updatedCodigos.splice(index, 1);
        updatedTypes.splice(index, 1);
        updatedCosts.splice(index, 1);
        setSelectedCodigos(updatedCodigos);
        setSelectedTypes(updatedTypes);
        setSelectedCosts(updatedCosts);
    };

    const handleItemChange = (index, field, value) => {
        const updatedItems = [...items];
        updatedItems[index][field] = value;
        setItems(updatedItems);
    };

    const totalCost = selectedCosts.reduce((acc, curr) => acc + (curr || 0), 0);

    // 🔥 Definir o custo final para ser enviado ao Firestore
    const finalCost = cost !== "" ? parseFloat(cost) : totalCost;
    
    // Calcula o custo total corretamente (considerando todos os itens)
    const calculatedTotalCost =
        selectedCosts.reduce((acc, cost) => acc + (parseFloat(cost) || 0), 0) +
        items.reduce((acc, item) => acc + (parseFloat(item.price) || 0), 0);

        useEffect(() => {
            setCost(calculatedTotalCost.toFixed(2)); // Inicializa o custo com o valor correto
        }, [calculatedTotalCost]);

   const handleSubmit = async (e) => {
  e.preventDefault();

  if (!id) {
    console.error("Erro: ID do serviço não encontrado!");
    return;
  }

  try {
    // Tenta buscar primeiro em 'services', depois em 'archived_services'
    let collectionName = "services";
    let serviceRef = doc(db, "services", id);
    let serviceSnap = await getDoc(serviceRef);

    if (!serviceSnap.exists()) {
      collectionName = "archived_services";
      serviceRef = doc(db, "archived_services", id);
      serviceSnap = await getDoc(serviceRef);
    }

    if (!serviceSnap.exists()) {
      console.error("Serviço não encontrado em nenhuma coleção!");
      return;
    }

    // Dados atualizados
    const updatedData = {
      carId: selectedCar,
      codigo: selectedCodigos,
      type: selectedTypes,
      date,
      description,
      costs: selectedCosts,
      totalCost: finalCost,
      status,
      paid,
      purchases: items.map(item => item.name || ""),
      purchasesprice: items.map(item => parseFloat(item.price) || 0),
      km: km ? km.toString() : null,
    };

    // Atualiza o serviço na coleção original
    await updateDoc(serviceRef, updatedData);

    const isComplete = paid && status === 'completed';

    if (collectionName === "services" && isComplete) {
      // Move para arquivados
      await setDoc(doc(db, "archived_services", id), updatedData);
      await deleteDoc(doc(db, "services", id));
      console.log("Serviço arquivado após atualização.");
    } else if (collectionName === "archived_services" && !isComplete) {
      // Volta para serviços ativos
      await setDoc(doc(db, "services", id), updatedData);
      await deleteDoc(doc(db, "archived_services", id));
      console.log("Serviço desarquivado após atualização.");
    }

    // ✅ Atualiza (ou cria) em allservices sempre
    await setDoc(doc(db, "allservices", id), updatedData);
    console.log("Serviço atualizado na coleção allservices.");

    navigate(`/car-services/${selectedCar}`);
  } catch (error) {
    console.error("Erro ao atualizar serviço no Firestore:", error);
  }
};  

    return (
        <div className="h-screen">
            <Navbar />
            <div className="container mx-auto p-4">
                <h1 className="text-2xl font-bold mb-4">Editar Serviço</h1>
                <form onSubmit={handleSubmit} className="space-y-4">
                <div className="mb-4">                   
                    <label className="block mb-1">Selecionar Cliente:</label>
                    <select 
                        value={selectedClient} 
                        onChange={(e) => setSelectedClient(e.target.value)} 
                        className="border p-2 w-full"
                        required
                    >
                        <option value="">Selecione um cliente</option>
                        {clients.map((client) => (
                            <option key={client.id} value={client.id}>{client.name}</option>
                        ))}
                    </select>
                </div>

        {/* Carro */}
        {selectedClient && (
            <div>
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
                        <label className="block mb-1">Editar KMs:</label>
                        <input 
                            type="text" 
                            value={km} 
                            onChange={(e) => setKm(e.target.value.replace(/\s+/g, '').replace(/[.,]/g, ''))} 
                            className="border p-2 w-full mt-1" 
                        />
                    </div>
    
                    {/* Campos de Serviço */}
                    <div>
                    {selectedCodigos.map((codigo, index) => {
                        // Verifica se o serviço tem código associado
                        const hasCodigo = Boolean(codigo);
                        const hasServico = Boolean(selectedTypes[index]?.trim());

                        return (
                            <div key={index} className="mb-2 border-2 border-blue-500 p-3 rounded-lg shadow-sm">
                                {/* Código do Serviço - Aparece apenas se houver código ou se nenhum campo estiver preenchido */}
                                {hasCodigo || (!hasCodigo && !hasServico) ? (
                                    <>
                                        <label className="block text-sm font-medium text-gray-700">Código do Serviço</label>
                                        <select
                                            value={codigo || ""}
                                            onChange={(e) => {
                                                const newCodigo = e.target.value;
                                                const updatedCodigos = [...selectedCodigos];
                                                updatedCodigos[index] = newCodigo;
                                                setSelectedCodigos(updatedCodigos);

                                                const selectedService = existingCodes.find(service => service.codigo === newCodigo);
                                                const updatedTypes = [...selectedTypes];
                                                const updatedCosts = [...selectedCosts];

                                                if (selectedService) {
                                                    updatedTypes[index] = selectedService.funcao;
                                                    updatedCosts[index] = parseFloat(selectedService.preco) || 0;
                                                } else {
                                                    updatedTypes[index] = "";
                                                    updatedCosts[index] = 0;
                                                }

                                                setSelectedTypes(updatedTypes);
                                                setSelectedCosts(updatedCosts);
                                            }}
                                            className="mt-1 block w-full border border-gray-300 rounded px-3 py-2"
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
                                ) : null}

                                {/* Serviço - Aparece apenas se não houver código ou se nenhum campo estiver preenchido */}
                                {!hasCodigo || (!hasCodigo && !hasServico) ? (
                                    <>
                                        <label className="block text-sm font-medium text-gray-700 mt-2">Serviço</label>
                                        <input
                                            type="text"
                                            value={selectedTypes[index] || ""}
                                            onChange={(e) => {
                                                const updatedTypes = [...selectedTypes];
                                                updatedTypes[index] = e.target.value;
                                                setSelectedTypes(updatedTypes);

                                                // Se o usuário começar a digitar manualmente, remover o código
                                                if (e.target.value.trim() !== "") {
                                                    const updatedCodigos = [...selectedCodigos];
                                                    updatedCodigos[index] = "";
                                                    setSelectedCodigos(updatedCodigos);
                                                }
                                            }}
                                            onBlur={() => {
                                                // Se o campo ficar vazio, volta a exibir o select do código
                                                if (!selectedTypes[index]?.trim()) {
                                                    const updatedCodigos = [...selectedCodigos];
                                                    updatedCodigos[index] = "";
                                                    setSelectedCodigos(updatedCodigos);
                                                }
                                            }}
                                            className="mt-1 block w-full border border-gray-300 rounded px-3 py-2"
                                        />
                                    </>
                                ) : null}

                                {/* Custo (€) - Sempre visível */}
                                <label className="block text-sm font-medium text-gray-700 mt-2">Custo (€)</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={selectedCosts[index] || ""}
                                    onChange={(e) => {
                                        const updatedCosts = [...selectedCosts];
                                        updatedCosts[index] = parseFloat(e.target.value) || 0;
                                        setSelectedCosts(updatedCosts);
                                    }}
                                    className="mt-1 block w-full border border-gray-300 rounded px-3 py-2"
                                />
                                
                                {/* Botões */}
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
                        );
                    })}
                    <h2 className="text-xl font-semibold mt-4">Itens</h2>

                    {items.map((item, index) => (
                        <div key={index} className="mb-2 border-2 border-yellow-400 p-3 rounded-lg shadow-sm">
                            <label className="block text-sm font-medium text-gray-700">Peças/Serviços de terceiros</label>
                            <textarea
                                value={item.name || ""}
                                onChange={(e) => handleItemChange(index, "name", e.target.value)}
                                className="mt-1 block w-full border border-gray-300 rounded px-3 py-2"
                                rows="2"
                            ></textarea>

                            <label className="block text-sm font-medium text-gray-700 mt-2">Preço (€)</label>
                            <input
                                type="number"
                                step="0.01"
                                value={item.price || ""}
                                onChange={(e) => handleItemChange(index, "price", e.target.value)}
                                className="mt-1 block w-full border border-gray-300 rounded px-3 py-2"
                            />
                        </div>
                    ))}

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
                        <p className="text-md text-gray-600 mt-2">
                            <strong>Custo total definido anteriormente:</strong> {previousTotalCost.toFixed(2)} €
                        </p>
                        <label className="block text-sm font-medium text-gray-700 mt-2">Custo Final (€)</label>
                        <input
                            type="number"
                            step="0.01"
                            value={cost} // Não usa fallback imediato
                            onChange={(e) => {
                                const value = e.target.value;
                                setCost(value === '' ? '' : parseFloat(value) || 0); // Permite campo vazio temporariamente
                            }}
                            onBlur={() => {
                                if (cost === '') {
                                    setCost(calculatedTotalCost.toFixed(2)); // Apenas repõe se estiver realmente vazio ao sair
                                }
                            }}
                            className="mt-1 block w-full border border-gray-300 rounded px-3 py-2 font-medium text-green-600"
                        />
                    </div>
    
                    {/* Outros Campos */}
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
    
                    <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded">Salvar</button>
                </form>
            </div>
        </div>
    );    
};

export default EditService;