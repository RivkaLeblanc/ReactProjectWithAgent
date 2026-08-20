import React, { useState, useEffect } from 'react';
import "./ClientDetailsPage.css"
import { useNavigate } from 'react-router-dom';
import Navbar from '../Navbar/Navbar';

const API = import.meta.env.VITE_API_URL;



interface ClientDetails {
    id: string;
    firstName:string;
    lastName: string;
    email: string;
}

export const ClientDetailsPage: React.FC = () => {
    const [details, setDetails] = useState<ClientDetails | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState<ClientDetails | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchClientDetails();
    }, []);

    const fetchClientDetails = async () => {
        try {
            const userId = localStorage.getItem('userId');
            if (!userId) {
                setError('User ID not found');
                return;
            }

            const response = await fetch(`${API}/users/${userId}`);
            if (!response.ok) throw new Error('Failed to fetch details');

            const data = await response.json();
            setDetails(data);
            setFormData(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred');
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => prev ? { ...prev, [name]: value } : null);
    };

    const handleSave = async () => {
        if (!formData) return;

        try {
            const response = await fetch(`${API}/users/${formData.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            if (!response.ok) throw new Error('Failed to update details');

            setDetails(formData);
            setIsEditing(false);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to save changes');
        }
    };

    if (loading) return <div>Loading...</div>;
    if (error) return <div>Error: {error}</div>;
    if (!details) return <div>No details found</div>;

    return (
        <>
            <Navbar />
            <div className="client-details-container">
                <h1>Personal Details</h1>

            {isEditing ? (
                <form className="edit-form">
                    <div className="form-group">
                        <label>First name:</label>
                        <input type="text" name="firstName" value={formData?.firstName || ''} onChange={handleInputChange} />
                    </div>
                    <div className="form-group">
                        <label>Last name:</label>
                        <input type="text" name="lastName" value={formData?.lastName || ''} onChange={handleInputChange} />
                    </div>
                    <div className="form-group">
                        <label>Email:</label>
                        <input type="email" name="email" value={formData?.email || ''} onChange={handleInputChange} />
                    </div>

                    <button type="button" onClick={handleSave}>Save</button>
                    <button type="button" onClick={() => { setIsEditing(false); setFormData(details); }}>Cancel</button>
                </form>
            ) : (
                <div className="details-view">
                    <p><strong>First name:</strong> {details.firstName}</p>
                     <p><strong>last name:</strong> {details.lastName}</p>
                    <p><strong>Email:</strong> {details.email}</p>
                    <button onClick={() => setIsEditing(true)}>Edit</button>
                </div>
            )}
            </div>
        </>
    );
};

export default ClientDetailsPage