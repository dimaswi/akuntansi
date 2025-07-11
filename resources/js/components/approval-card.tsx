import React from 'react';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { 
    Clock, 
    User, 
    DollarSign, 
    CheckCircle, 
    XCircle, 
    AlertTriangle,
    MessageSquare
} from "lucide-react";
import { cn } from "@/lib/utils";

// Utility functions
const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(amount);
};

const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
};

interface Approval {
    id: number;
    approval_type: string;
    status: 'pending' | 'approved' | 'rejected' | 'escalated';
    amount?: number;
    expires_at?: string;
    request_notes?: string;
    approval_notes?: string;
    rejection_reason?: string;
    created_at: string;
    approved_at?: string;
    requested_by: {
        id: number;
        name: string;
    };
    approved_by?: {
        id: number;
        name: string;
    };
    approvable: {
        type: string;
        id: number;
        display_name?: string;
    };
}

interface ApprovalCardProps {
    approval: Approval;
    onApprove?: (id: number, notes?: string) => void;
    onReject?: (id: number, reason: string) => void;
    canApprove?: boolean;
}

export default function ApprovalCard({ 
    approval, 
    onApprove, 
    onReject, 
    canApprove = false 
}: ApprovalCardProps) {
    const [notes, setNotes] = React.useState('');
    const [rejectionReason, setRejectionReason] = React.useState('');
    const [showApproveForm, setShowApproveForm] = React.useState(false);
    const [showRejectForm, setShowRejectForm] = React.useState(false);

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'pending':
                return <Badge variant="outline" className="text-yellow-600 border-yellow-300"><Clock className="w-3 h-3 mr-1" /> Pending</Badge>;
            case 'approved':
                return <Badge variant="outline" className="text-green-600 border-green-300"><CheckCircle className="w-3 h-3 mr-1" /> Approved</Badge>;
            case 'rejected':
                return <Badge variant="outline" className="text-red-600 border-red-300"><XCircle className="w-3 h-3 mr-1" /> Rejected</Badge>;
            case 'escalated':
                return <Badge variant="outline" className="text-orange-600 border-orange-300"><AlertTriangle className="w-3 h-3 mr-1" /> Escalated</Badge>;
            default:
                return <Badge variant="outline">{status}</Badge>;
        }
    };

    const getApprovalTypeLabel = (type: string) => {
        switch (type) {
            case 'transaction':
                return 'Transaction Approval';
            case 'journal_posting':
                return 'Journal Posting Approval';
            case 'monthly_closing':
                return 'Monthly Closing Approval';
            default:
                return type.replace('_', ' ').toUpperCase();
        }
    };

    const isExpired = approval.expires_at && new Date(approval.expires_at) < new Date();

    const handleApprove = () => {
        if (onApprove) {
            onApprove(approval.id, notes);
            setShowApproveForm(false);
            setNotes('');
        }
    };

    const handleReject = () => {
        if (onReject && rejectionReason.trim()) {
            onReject(approval.id, rejectionReason);
            setShowRejectForm(false);
            setRejectionReason('');
        }
    };

    return (
        <Card className={`${isExpired && approval.status === 'pending' ? 'border-red-300 bg-red-50' : ''}`}>
            <CardHeader>
                <div className="flex justify-between items-start">
                    <div>
                        <CardTitle className="text-lg">{getApprovalTypeLabel(approval.approval_type)}</CardTitle>
                        <CardDescription>
                            {approval.approvable.display_name || `${approval.approvable.type} #${approval.approvable.id}`}
                        </CardDescription>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                        {getStatusBadge(approval.status)}
                        {isExpired && approval.status === 'pending' && (
                            <Badge variant="destructive" className="text-xs">
                                <Clock className="w-3 h-3 mr-1" />
                                Expired
                            </Badge>
                        )}
                    </div>
                </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
                {/* Amount */}
                {approval.amount && (
                    <div className="flex items-center gap-2">
                        <DollarSign className="w-4 h-4 text-green-600" />
                        <span className="font-medium">{formatCurrency(approval.amount)}</span>
                    </div>
                )}

                {/* Requested by */}
                <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-blue-600" />
                    <span>Requested by: <strong>{approval.requested_by.name}</strong></span>
                </div>

                {/* Request date and expiry */}
                <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                    <div>
                        <span className="font-medium">Requested:</span><br />
                        {formatDate(approval.created_at)}
                    </div>
                    {approval.expires_at && (
                        <div>
                            <span className="font-medium">Expires:</span><br />
                            <span className={isExpired ? 'text-red-600 font-medium' : ''}>
                                {formatDate(approval.expires_at)}
                            </span>
                        </div>
                    )}
                </div>

                {/* Request notes */}
                {approval.request_notes && (
                    <div className="bg-gray-50 p-3 rounded-md">
                        <div className="flex items-center gap-2 mb-2">
                            <MessageSquare className="w-4 h-4 text-gray-600" />
                            <span className="font-medium text-sm">Request Notes:</span>
                        </div>
                        <p className="text-sm text-gray-700">{approval.request_notes}</p>
                    </div>
                )}

                {/* Approval/Rejection details */}
                {approval.status === 'approved' && approval.approved_by && (
                    <div className="bg-green-50 p-3 rounded-md">
                        <div className="font-medium text-green-800 mb-1">
                            Approved by {approval.approved_by.name}
                        </div>
                        <div className="text-sm text-green-600">
                            {formatDate(approval.approved_at!)}
                        </div>
                        {approval.approval_notes && (
                            <p className="text-sm text-green-700 mt-2">{approval.approval_notes}</p>
                        )}
                    </div>
                )}

                {approval.status === 'rejected' && approval.approved_by && (
                    <div className="bg-red-50 p-3 rounded-md">
                        <div className="font-medium text-red-800 mb-1">
                            Rejected by {approval.approved_by.name}
                        </div>
                        <div className="text-sm text-red-600">
                            {formatDate(approval.approved_at!)}
                        </div>
                        {approval.rejection_reason && (
                            <p className="text-sm text-red-700 mt-2">{approval.rejection_reason}</p>
                        )}
                    </div>
                )}

                {/* Action buttons */}
                {canApprove && approval.status === 'pending' && (
                    <div className="flex gap-2 pt-4 border-t">
                        {!showApproveForm && !showRejectForm && (
                            <>
                                <Button 
                                    onClick={() => setShowApproveForm(true)}
                                    className="flex-1"
                                    variant="default"
                                >
                                    <CheckCircle className="w-4 h-4 mr-2" />
                                    Approve
                                </Button>
                                <Button 
                                    onClick={() => setShowRejectForm(true)}
                                    className="flex-1"
                                    variant="destructive"
                                >
                                    <XCircle className="w-4 h-4 mr-2" />
                                    Reject
                                </Button>
                            </>
                        )}

                        {/* Approve form */}
                        {showApproveForm && (
                            <div className="w-full space-y-3">
                                <div>
                                    <Label htmlFor={`approve-notes-${approval.id}`}>Approval Notes (Optional)</Label>
                                    <Textarea
                                        id={`approve-notes-${approval.id}`}
                                        value={notes}
                                        onChange={(e) => setNotes(e.target.value)}
                                        placeholder="Add any notes about this approval..."
                                        rows={3}
                                    />
                                </div>
                                <div className="flex gap-2">
                                    <Button onClick={handleApprove} className="flex-1">
                                        Confirm Approval
                                    </Button>
                                    <Button 
                                        onClick={() => setShowApproveForm(false)} 
                                        variant="outline"
                                        className="flex-1"
                                    >
                                        Cancel
                                    </Button>
                                </div>
                            </div>
                        )}

                        {/* Reject form */}
                        {showRejectForm && (
                            <div className="w-full space-y-3">
                                <div>
                                    <Label htmlFor={`reject-reason-${approval.id}`}>Rejection Reason *</Label>
                                    <Textarea
                                        id={`reject-reason-${approval.id}`}
                                        value={rejectionReason}
                                        onChange={(e) => setRejectionReason(e.target.value)}
                                        placeholder="Please provide a reason for rejection..."
                                        rows={3}
                                        required
                                    />
                                </div>
                                <div className="flex gap-2">
                                    <Button 
                                        onClick={handleReject} 
                                        variant="destructive"
                                        className="flex-1"
                                        disabled={!rejectionReason.trim()}
                                    >
                                        Confirm Rejection
                                    </Button>
                                    <Button 
                                        onClick={() => setShowRejectForm(false)} 
                                        variant="outline"
                                        className="flex-1"
                                    >
                                        Cancel
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
