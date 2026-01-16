import '@xyflow/react/dist/style.css';
import { Route, Routes } from 'react-router-dom';
import { CreateWorkflow } from './components/CreateWorkflow';
import { Auth } from './components/Auth';
import { Landing } from './components/Landing';

export function App() {
    return (
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/signin" element={<Auth mode="signin" />} />
        <Route path="/signup" element={<Auth mode="signup" />} />
        <Route path="/create" element={<CreateWorkflow />} />
      </Routes>
    )
}

export default App;