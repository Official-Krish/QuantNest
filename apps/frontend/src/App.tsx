import '@xyflow/react/dist/style.css';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { CreateWorkflow } from './components/CreateWorkflow';

export function App() {
    return (
      <BrowserRouter>
        <Routes>
          <Route path="/create" element={<CreateWorkflow />} />
        </Routes>
      </BrowserRouter>
    )
}

export default App;
