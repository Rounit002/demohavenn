import React, { useState, useEffect, useRef, useCallback } from 'react';
import { X, Share, Download, Printer, User, Phone, Mail, MapPin, Hash, CreditCard, AlertCircle } from 'lucide-react';
import { useReactToPrint } from 'react-to-print';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import api from '../services/api';
import { toast } from 'sonner';

// Types
interface StudentAssignment {
  seatId: number;
  shiftId: number;
  seatNumber: string;
  shiftTitle: string;
}

interface Student {
  id: number;
  name: string;
  email: string;
  phone: string;
  address: string;
  registrationNumber?: string | null;
  fatherName?: string | null;
  aadharNumber?: string | null;
  branchId: number;
  branchName?: string;
  membershipStart: string;
  membershipEnd: string;
  status: 'active' | 'expired';
  totalFee: number;
  amountPaid: number;
  dueAmount: number;
  cash: number;
  online: number;
  securityMoney: number;
  remark: string | null;
  profileImageUrl?: string | null;
  aadhaarFrontUrl?: string | null;
  aadhaarBackUrl?: string | null;
  lockerId?: number | null;
  lockerNumber?: string | null;
  createdAt: string;
  assignments?: Array<{
    seatId: number;
    shiftId: number;
    seatNumber: string;
    shiftTitle: string;
  }>;
  // Optional discount field since it's not in the API but might be needed
  discount?: number;
}

interface LibraryInfo {
  name: string;
  address?: string;
  phone?: string;
  email?: string;
}

interface InvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  studentId: number | null;
}

// Helper functions
const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

const InvoiceModal: React.FC<InvoiceModalProps> = ({ isOpen, onClose, studentId }) => {
  const [student, setStudent] = useState<Student | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const componentRef = useRef<HTMLDivElement>(null);

  const fetchStudentData = useCallback(async () => {
    if (!studentId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const studentData = await api.getStudent(studentId) as Student & { discount?: number };
      
      // Create a base student object with all required fields
      const formattedStudent: Student = {
        // Spread all properties from studentData first
        ...studentData,
        // Ensure all required string fields have a value
        name: studentData.name || '',
        email: studentData.email || '',
        phone: studentData.phone || '',
        address: studentData.address || '',
        membershipStart: studentData.membershipStart || new Date().toISOString(),
        membershipEnd: studentData.membershipEnd || new Date().toISOString(),
        status: studentData.status || 'active',
        // Ensure all required number fields have a value
        totalFee: studentData.totalFee ?? 0,
        amountPaid: studentData.amountPaid ?? 0,
        dueAmount: studentData.dueAmount ?? 0,
        cash: studentData.cash ?? 0,
        online: studentData.online ?? 0,
        securityMoney: studentData.securityMoney ?? 0,
        branchId: studentData.branchId ?? 0,
        // Handle potentially null/undefined fields
        remark: studentData.remark || null,
        createdAt: studentData.createdAt || new Date().toISOString(),
        // Initialize discount with a default value of 0
        discount: 0
      };
      
      // Update discount if it exists in studentData
      if (studentData.discount !== undefined) {
        formattedStudent.discount = Number(studentData.discount) || 0;
      }
      
      setStudent(formattedStudent);
    } catch (err) {
      console.error('Error fetching student data:', err);
      setError('Failed to load student data');
      toast.error('Failed to load student data');
    } finally {
      setLoading(false);
    }
  }, [studentId]);

  useEffect(() => {
    if (isOpen && studentId) fetchStudentData();
  }, [isOpen, studentId, fetchStudentData]);

  const handlePrint = useReactToPrint({
    content: () => componentRef.current,
    onAfterPrint: () => toast.success('Invoice printed successfully!'),
    pageStyle: `
      @page { 
        size: A4;
        margin: 10mm;
      }
      @media print {
        body { 
          -webkit-print-color-adjust: exact; 
        }
        .no-print { 
          display: none !important; 
        }
      }
    `,
    documentTitle: `Invoice_${student?.name || 'Student'}_${new Date().toISOString().split('T')[0]}`,
    removeAfterPrint: false,
  } as any); // Using 'as any' to bypass TypeScript errors with the pageStyle property

  const generatePdf = useCallback(async () => {
    if (!componentRef.current) return null;
    
    const element = componentRef.current;
    const canvas = await html2canvas(element, {
      scale: 2, // Higher scale for better quality
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
    });
    
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    const imgProps = pdf.getImageProperties(imgData);
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
    
    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
    return pdf;
  }, []);

  const handleDownload = useCallback(async () => {
    if (!student) return;
    
    try {
      const pdf = await generatePdf();
      if (!pdf) return;
      
      const fileName = `invoice_${student.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
      pdf.save(fileName);
      toast.success('Invoice downloaded as PDF!');
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error('Failed to generate PDF');
    }
  }, [student, generatePdf]);

  const handleWhatsAppShare = useCallback(async () => {
    if (!student) return;
    
    try {
      const pdf = await generatePdf();
      if (!pdf) return;
      
      // Generate a blob URL for the PDF
      const pdfBlob = pdf.output('blob');
      const pdfUrl = URL.createObjectURL(pdfBlob);
      
      // Create a temporary link to download the PDF
      const a = document.createElement('a');
      a.href = pdfUrl;
      a.download = `invoice_${student.name.replace(/\s+/g, '_')}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      
      // Clean up
      setTimeout(() => URL.revokeObjectURL(pdfUrl), 100);
      
      // Open WhatsApp with a message (user will need to manually attach the downloaded file)
      const message = `Here's the invoice for ${student.name}`;
      const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
      window.open(whatsappUrl, '_blank');
      
      toast.success('Downloaded PDF. Please attach it to WhatsApp.');
    } catch (error) {
      console.error('Error sharing via WhatsApp:', error);
      toast.error('Failed to share via WhatsApp');
    }
  }, [student, generatePdf]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75"></div>
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
          <div className="bg-gradient-to-r from-blue-600 to-blue-800 px-4 py-3 sm:px-6 flex justify-between items-center">
            <h3 className="text-lg leading-6 font-medium text-white">
              {student ? `Invoice - ${student.name}` : 'Invoice'}
            </h3>
            <div className="flex space-x-2">
              <button onClick={handlePrint} className="p-1 rounded-full text-white hover:bg-blue-700">
                <Printer className="h-5 w-5" />
              </button>
              <button onClick={onClose} className="p-1 rounded-full text-white hover:bg-blue-700">
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          <div className="bg-white px-4 pt-5 pb-4 sm:p-6">
            {loading ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
              </div>
            ) : error ? (
              <div className="text-center py-10">
                <AlertCircle className="mx-auto h-12 w-12 text-red-500" />
                <h3 className="mt-2 text-lg font-medium text-gray-900">Error loading invoice</h3>
                <p className="mt-1 text-sm text-gray-500">{error}</p>
                <button
                  onClick={fetchStudentData}
                  className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
                >
                  Retry
                </button>
              </div>
            ) : student ? (
              <div ref={componentRef} className="space-y-6">
                {/* Student and Payment Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">Bill To:</h3>
                    <p className="text-gray-900">{student.name}</p>
                    {student.fatherName && <p className="text-gray-600">S/O {student.fatherName}</p>}
                    {student.registrationNumber && <p className="text-gray-600">Reg: {student.registrationNumber}</p>}
                    {student.phone && <p className="text-gray-600 flex items-center"><Phone className="h-4 w-4 mr-1" /> {student.phone}</p>}
                    {student.email && <p className="text-gray-600 flex items-center"><Mail className="h-4 w-4 mr-1" /> {student.email}</p>}
                  </div>
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h3 className="text-sm font-medium text-blue-800 mb-2">Membership Period</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-500">Start Date</p>
                        <p className="text-sm font-medium">{formatDate(student.membershipStart)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">End Date</p>
                        <p className="text-sm font-medium">{formatDate(student.membershipEnd)}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Payment Summary */}
                <div className="mt-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Payment Summary</h3>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>Total Fee:</span>
                        <span className="font-medium">{formatCurrency(student.totalFee)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Amount Paid:</span>
                        <span className="text-green-600">{formatCurrency(student.amountPaid)}</span>
                      </div>
                      <div className="flex justify-between border-t border-gray-200 pt-2">
                        <span className="font-medium">Balance Due:</span>
                        <span className="font-medium">{formatCurrency(student.dueAmount)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    onClick={handleDownload}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </button>
                  <button
                    onClick={handleWhatsAppShare}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700"
                  >
                    <Share className="h-4 w-4 mr-2" />
                    Share via WhatsApp
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
};

export default React.memo(InvoiceModal);
