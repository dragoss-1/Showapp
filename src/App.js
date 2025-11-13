import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './firebase';
//-------------------------------------------------------------- 
import Clients from './components/Clients/Clients';
import LoginComponent from './components/LoginComponent';
import Loading from './components/Loading';
import AddClient from './components/Clients/AddClient';
import EditClient from './components/Clients/EditClient';
import Cars from './components/Cars/Cars';
import AddCar from './components/Cars/AddCar'
import EditCar from './components/Cars/EditCar';
import CarServices from './components/Services/CarServices';
import AddService from './components/Services/AddService';
import EditService from './components/Services/EditService';
import CodeList from './components/Codes/CodeList';
import AddCode from './components/Codes/AddCode';
import EditCode from './components/Codes/EditCode';
import AdicionarNovidade from './components/AdicionarNovidade';
import ContasList from './components/Contas/ContasList';
import PrintDetails from './components/Contas/PrintContas';
import StickerPage from "./components/Services/ServiceSticker"; // Página do autocolante
import ArchivedServices from './components/Services/ArchivedServices';
//--------------------------------------------------------------

const App = () => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
            setLoading(false); // Finaliza o loading quando a autenticação for verificada
        });

        return () => unsubscribe();
    }, []);

    if (loading) {
        return <Loading />; // Mostra o componente de loading enquanto carrega
    }

    return (
        <Router>
            <Routes>
                <Route path="/login" element={<LoginComponent />} />
                <Route path="/" element={user ? <Clients/> : <Navigate to="/login" />} />
                <Route path="/add-client" element={<AddClient />} />
                <Route path="/edit/:id" element={<EditClient />} />
                <Route path="/cars/:id" element={<Cars />} />
                <Route path="/car-services/:id" element={<CarServices />} />
                <Route path="/add-service/:id" element={<AddService />} />
                <Route path="/add-car/:id" element={<AddCar />} />
                <Route path="/edit-car/:id" element={<EditCar />} />
                <Route path="/edit-service/:id" element={<EditService />} />
                <Route path="/codes" element={<CodeList />} />
                <Route path="/add-codigo" element={<AddCode />} />
                <Route path="/edit-codigo/:id" element={<EditCode />} />
                <Route path="/adicionar-novidade" element={<AdicionarNovidade />} />
                <Route path="/contas" element={<ContasList />} />
                <Route path="/imprimir-conta/:id" element={<PrintDetails />} />
                <Route path="/sticker/:serviceId" element={<StickerPage />} />
                <Route path="/archived-services/:id" element={<ArchivedServices />} />

            </Routes>
        </Router>
    );
};

export default App;
