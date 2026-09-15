import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'

import { ThemeProvider } from './context/themeContext.jsx'

import {
  createBrowserRouter,
  createRoutesFromElements,
  RouterProvider,
  Route,
  Navigate,
  Outlet,
} from 'react-router-dom'

import Navbar from './components/layout/Navbar.jsx'
import Navigator from './components/layout/Navigator.jsx'
import ScrollRestoration from './components/layout/ScrollRestoration.jsx'
import { ScadenzeOriginTracker } from './hooks/navigation.js'

import Dashboard from './pages/Dashboard.jsx'
import Car from './pages/Car.jsx'
import CarLayout from './pages/CarLayout.jsx'
import AddCar from './pages/AddCar.jsx'
import CarInfo from './pages/CarInfo.jsx'
import EditCar from './pages/EditCar.jsx'
import Settings from './pages/Settings.jsx'
import GestisciScadenze from './pages/GestisciScadenze/GestisciScadenze.jsx'
import Assicurazione from './pages/GestisciScadenze/Assicurazione/Assicurazione.jsx'
import AggiungiAssicurazione from './pages/GestisciScadenze/Assicurazione/AggiungiAssicurazione.jsx'
import ModificaAssicurazione from './pages/GestisciScadenze/Assicurazione/ModificaAssicurazione.jsx'
import Bollo from './pages/GestisciScadenze/Bollo/Bollo.jsx'
import AggiungiBollo from './pages/GestisciScadenze/Bollo/AggiungiBollo.jsx'
import ModificaBollo from './pages/GestisciScadenze/Bollo/ModificaBollo.jsx'
import Revisione from './pages/GestisciScadenze/Revisione/Revisione.jsx'
import AggiungiRevisione from './pages/GestisciScadenze/Revisione/AggiungiRevisione.jsx'
import ModificaRevisione from './pages/GestisciScadenze/Revisione/ModificaRevisione.jsx'
import Tagliando from './pages/GestisciScadenze/Tagliando/Tagliando.jsx'
import AggiungiTagliando from './pages/GestisciScadenze/Tagliando/AggiungiTagliando.jsx'
import ModificaTagliando from './pages/GestisciScadenze/Tagliando/ModificaTagliando.jsx'
import CarTable from './pages/CarTable.jsx'
import Email from './pages/Email.jsx'

import Riepilogo from './pages/GestisciScadenze/Riepilogo.jsx'

import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

function AppLayout() {
  return (
    <>
      <Navbar />
      <ScrollRestoration />
      <ScadenzeOriginTracker />
      <Navigator />
      <Outlet />
    </>
  )
}

const router = createBrowserRouter(
  createRoutesFromElements(
    <>
      <Route path="/login" element={<Navigate to="/" replace />} />
      <Route element={<AppLayout />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/car" element={<CarLayout />}>
          <Route index element={<Car />} />
          <Route path="table" element={<CarTable />} />
        </Route>
        <Route path="/cartable" element={<Navigate to="/car/table" replace />} />
        <Route path="/addCar" element={<AddCar />} />
        <Route path="/editCar/:id" element={<EditCar />} />
        <Route path="/carInfo/:id" element={<CarInfo />} />
        <Route path="/gestisci-scadenze/:id" element={<GestisciScadenze />}>
          <Route index element={<Navigate to="riepilogo" replace />} />
          <Route path="riepilogo" element={<Riepilogo />} />
          <Route path="assicurazione">
            <Route index element={<Assicurazione />} />
            <Route path="aggiungi" element={<AggiungiAssicurazione />} />
            <Route path="modifica/:assicurazioneId" element={<ModificaAssicurazione />} />
          </Route>
          <Route path="bollo">
            <Route index element={<Bollo />} />
            <Route path="aggiungi" element={<AggiungiBollo />} />
            <Route path="modifica/:bolloId" element={<ModificaBollo />} />
          </Route>
          <Route path="revisione">
            <Route index element={<Revisione />} />
            <Route path="aggiungi" element={<AggiungiRevisione />} />
            <Route path="modifica/:revisioneId" element={<ModificaRevisione />} />
          </Route>
          <Route path="tagliando">
            <Route index element={<Tagliando />} />
            <Route path="aggiungi" element={<AggiungiTagliando />} />
            <Route path="modifica/:tagliandoId" element={<ModificaTagliando />} />
          </Route>
        </Route>
        <Route path="/email" element={<Email />} />
        <Route path="/settings" element={<Settings />} />
      </Route>
    </>
  )
)

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ThemeProvider>
      <RouterProvider router={router} />
      <ToastContainer position="top-right" autoClose={3000} />
    </ThemeProvider>
  </StrictMode>,
)
