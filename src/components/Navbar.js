import React, { useRef, useState, useEffect } from 'react';
import { auth, db } from '../firebase';
import { collection, query, onSnapshot, doc, deleteDoc } from 'firebase/firestore';
import { useNavigate, useLocation } from 'react-router-dom';

const logoUrl = '/logo.png';

const Navbar = () => {
    const [hovered, setHovered] = useState('');
    const [novidades, setNovidades] = useState([]);
    const [showNovidades, setShowNovidades] = useState(false);
    const [userEmail, setUserEmail] = useState(null);
    const navigate = useNavigate();
    const location = useLocation();
    const novidadesRef = useRef(null);

    useEffect(() => {
        function handleClickOutside(event) {
            if (novidadesRef.current && !novidadesRef.current.contains(event.target)) {
                setShowNovidades(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    useEffect(() => {
        // Observar autenticação do usuário
        const unsubscribeAuth = auth.onAuthStateChanged((user) => {
            if (user) {
                setUserEmail(user.email);
            } else {
                setUserEmail(null);
            }
        });

        // Observar novidades no Firebase
        const q = query(collection(db, 'novidades'));
        const unsubscribeNovidades = onSnapshot(q, (snapshot) => {
            const novasNovidades = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setNovidades(novasNovidades);
        });

        return () => {
            unsubscribeAuth();
            unsubscribeNovidades();
        };
    }, []);

    const handleMouseEnter = (option) => setHovered(option);
    const handleMouseLeave = () => setHovered('');

    const handleLogout = async () => {
        await auth.signOut();
        navigate('/login');
    };

    const deleteNovidade = async (id) => {
        await deleteDoc(doc(db, 'novidades', id));
    };

    return (
        <nav className="bg-gray-800 text-white p-4 relative">
            <div className="container mx-auto flex justify-between items-center">
                
                {/* Logotipo */}
                <div className="flex items-center">
                    <img
                        src={logoUrl}
                        alt="Logotipo VA Auto"
                        className="h-10 mr-2 rounded-lg ring-2 ring-red-500 ring-offset-4 ring-offset-slate-50 dark:ring-offset-slate-900"
                    />
                    <h1 className="ml-2 text-2xl font-bold">
                        <a href="/">Ariton</a>
                    </h1>
                </div>

                {/* Links de Navegação */}
                <div className="flex space-x-6">
                    {[
                        { name: 'Clientes', path: '/', emoji: '🙋🏻‍♂️' },
                        { name: 'Carros', path: '/cars/0', emoji: '🚗' },
                        { name: 'Serviços', path: '/car-services/0', emoji: '🛠️' },
                        { name: 'Contas', path: '/contas', emoji: '🏦' },
                        { name: 'Códigos', path: '/codes', emoji: '📜' },
                    ].map((item) => (
                        <span
                            key={item.name}
                            onClick={() => navigate(item.path)}
                            onMouseEnter={() => handleMouseEnter(item.name)}
                            onMouseLeave={handleMouseLeave}
                            className={`cursor-pointer p-2 rounded transition-colors ${
                                hovered === item.name ? 'bg-gray-700' : ''
                            } ${location.pathname === item.path ? 'border-b-2 border-red-500' : ''}`}
                        >
                            {item.emoji} {item.name}
                        </span>
                    ))}

                    {/* Botão de Notificações */}
                    <button
                        className="relative p-2 rounded-full hover:bg-gray-700"
                        onClick={() => setShowNovidades(!showNovidades)}
                    >
                        🔔
                        {novidades.length > 0 && (
                            <span className="absolute top-0 right-0 bg-red-500 text-white text-xs rounded-full px-2">
                                {novidades.length}
                            </span>
                        )}
                    </button>

                    {/* Lista de Novidades */}
                    {showNovidades && (
                        <div 
                            ref={novidadesRef} 
                            className="absolute right-0 mt-2 w-72 bg-white text-black rounded-lg shadow-lg p-4 z-50"
                        >
                            <div className="flex justify-between items-center">
                                <h3 className="font-bold text-lg">Novidades</h3>
                                {/* Botão de fechar */}
                                <button onClick={() => setShowNovidades(false)} className="text-gray-500 hover:text-black">
                                    ✖
                                </button>
                            </div>
                            <hr className="my-2"/>
                            {novidades.length === 0 ? (
                                <p className="text-gray-500">Sem novas novidades</p>
                            ) : (
                                novidades.map((novidade) => (
                                    <div
                                        key={novidade.id}
                                        className="bg-gray-100 p-3 rounded mb-2 shadow"
                                    >
                                        <h4 className="font-bold">{novidade.Titulo}</h4>
                                        <p className="text-sm text-gray-700">{novidade.Descricao}</p>
                                        <button
                                            onClick={() => deleteNovidade(novidade.id)}
                                            className="text-red-500 text-sm mt-2"
                                        >
                                            ❌ Dispensar
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>
                    )}

                    {/* Exibir botão "Adicionar Novidade" apenas se o e-mail for "dragosariton2004@gmail.com" */}
                    {userEmail === "dragosariton2004@gmail.com" && (
                        <button
                            onClick={() => navigate('/adicionar-novidade')}
                            onMouseEnter={() => setHovered('Adicionar Novidade')}
                            onMouseLeave={() => setHovered('')}
                            className={`cursor-pointer p-2 rounded transition-colors ${
                                hovered === 'Adicionar Novidade' ? 'bg-gray-700' : ''
                            } text-white`}
                        >
                            ➕ News
                        </button>
                    )}

                    {/* Botão Logout */}
                    <button
                        onClick={handleLogout}
                        className="bg-red-500 hover:bg-red-600 text-white py-2 px-4 rounded flex items-center space-x-2"
                    >
                        🚪 Logout
                    </button>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
