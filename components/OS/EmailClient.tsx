import React, { useState, useEffect } from 'react';
import { audioService } from '../../services/audioService';
import { UserProfile } from '../../types';

interface EmailClientProps {
    userProfile: UserProfile;
}

interface Email {
    id: number;
    from: string;
    subject: string;
    date: string;
    body: string;
    read: boolean;
    urgent?: boolean;
}

const BASE_EMAILS: Email[] = [
    {
        id: 1,
        from: "admin@mnemosyne.lab",
        subject: "PROTOCOL 7: INSTRUCTIONS",
        date: "TODAY",
        body: "You are authorized to use the RECOVERY TOOL on the desktop.\n\nYour task is to locate the 'Disk Fragments' inside the simulation. \n\nWARNING: The simulation is constructed from the patient's subconscious. Do not interact with the 'Patient' if you see him. He is a glitch.",
        read: false,
        urgent: true
    },
    {
        id: 2,
        from: "dr.kogan@mnemosyne.lab",
        subject: "Subject 7 History",
        date: "YESTERDAY",
        body: "Attached: Medical History.\n\nPatient was admitted following a psychotic break. Claims 'the computer is watching him'. \n\nIronically, we are using a computer to fix him. \n\nNote: If the monitors in your room start flickering, it's just power fluctuations. Ignore it.",
        read: false
    }
];

const EmailClient: React.FC<EmailClientProps> = ({ userProfile }) => {
    const [selectedEmail, setSelectedEmail] = useState<Email | null>(null);
    const [emailList, setEmailList] = useState<Email[]>([]);

    useEffect(() => {
        // Construct email list based on profile data (EASTER EGGS)
        let customEmails = [...BASE_EMAILS];

        // ACT 1: ATMOSPHERE (Reply-All)
        customEmails.push({
            id: 101,
            from: "facility_ops@mnemosyne.lab",
            subject: "FW: RE: Noise complaint (Ticket #994)",
            date: "TODAY",
            body: ">> FROM: J. Miller\n>> TO: All Staff\n\nCan someone PLEASE check the server room? That humming sound is drilling into my skull.\n\n----------------\n\n>> FROM: IT_Daemon\n\nAnalysis: The frequency is coming from Terminal 3. It started exactly when user '" + userProfile.username + "' sat down. It's not the fan. It's the audio output feeding back into the room microphone.",
            read: false
        });

        // ACT 2: INVASION (Spam)
        let fearText = "We know you are alone.";
        if (userProfile.fear === 'DARKNESS') fearText = "Why do you keep looking at the shadows in the corner?";
        if (userProfile.fear === 'SCOPAESTHESIA') fearText = "Covering the webcam won't stop us from seeing you.";
        if (userProfile.fear === 'FAILURE') fearText = "Everyone knows you are going to fail this test.";

        customEmails.push({
            id: 666,
            from: "unknown_sender@void.net",
            subject: "HOT SINGLES IN YOUR AREA!",
            date: "TOMORROW",
            body: "Find compatible matches nearby!\n\n...\n\n\n" + fearText,
            read: true, // Already read to catch eye
            urgent: false
        });

        setEmailList(customEmails);
    }, [userProfile]);

    const selectEmail = (email: Email) => {
        audioService.playUiClick();
        setSelectedEmail(email);
        const newList = emailList.map(e => e.id === email.id ? {...e, read: true} : e);
        setEmailList(newList);
    };

    const handleDelete = () => {
        if(!selectedEmail) return;
        audioService.playUiClick();
        setEmailList(prev => prev.filter(e => e.id !== selectedEmail.id));
        setSelectedEmail(null);
    };

    return (
        <div className="flex flex-col h-full bg-gray-200 font-sans text-sm text-black">
            {/* Toolbar */}
            <div className="bg-gray-100 border-b border-gray-400 p-2 flex gap-4">
                <button className="flex flex-col items-center opacity-50 cursor-not-allowed">
                    <span>📩</span>
                    <span className="text-xs">New Mail</span>
                </button>
                <button className="flex flex-col items-center hover:bg-gray-300 px-2 rounded" onClick={handleDelete}>
                     <span>🗑️</span>
                    <span className="text-xs">Delete</span>
                </button>
                 <button className="flex flex-col items-center" onClick={() => {audioService.playError();}}>
                     <span>🔄</span>
                    <span className="text-xs">Send/Recv</span>
                </button>
            </div>

            <div className="flex flex-1 overflow-hidden">
                {/* Sidebar */}
                <div className="w-1/3 bg-white border-r border-gray-400 overflow-y-auto">
                    {emailList.map(email => (
                        <div 
                            key={email.id}
                            onClick={() => selectEmail(email)}
                            className={`p-2 border-b border-gray-200 cursor-pointer hover:bg-blue-100 ${selectedEmail?.id === email.id ? 'bg-blue-600 text-white hover:bg-blue-700' : ''} ${!email.read ? 'font-bold' : ''}`}
                        >
                            <div className="flex justify-between">
                                <span className="truncate w-2/3 text-xs">{email.from}</span>
                                {email.urgent && <span className="text-red-500 font-bold">!</span>}
                            </div>
                            <div className="truncate text-sm">{email.subject}</div>
                        </div>
                    ))}
                </div>

                {/* Preview Pane */}
                <div className="w-2/3 bg-white p-4 overflow-y-auto flex flex-col">
                    {selectedEmail ? (
                        <>
                            <div className="border-b border-gray-300 pb-4 mb-4 bg-gray-50 p-4 shadow-sm">
                                <p><span className="font-bold text-gray-600">From:</span> {selectedEmail.from}</p>
                                <p><span className="font-bold text-gray-600">Date:</span> {selectedEmail.date}</p>
                                <p><span className="font-bold text-gray-600">Subject:</span> {selectedEmail.subject}</p>
                            </div>
                            <div className="whitespace-pre-wrap font-serif text-lg leading-relaxed">
                                {selectedEmail.body}
                            </div>
                        </>
                    ) : (
                        <div className="h-full flex items-center justify-center text-gray-400">
                            Select an email to view
                        </div>
                    )}
                </div>
            </div>
            
            <div className="bg-gray-100 border-t border-gray-400 p-1 text-xs">
                {emailList.filter(e => !e.read).length} unread message(s)
            </div>
        </div>
    );
};

export default EmailClient;