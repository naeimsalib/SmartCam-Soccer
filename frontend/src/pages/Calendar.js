import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";
import { useAuth } from "../contexts/AuthContext";
import dayjs from "dayjs";
import { Box, Paper, Typography, Button, CircularProgress, Stack, Alert, IconButton, Dialog, DialogTitle, DialogContent, DialogActions, } from "@mui/material";
import { DatePicker, TimePicker } from "@mui/x-date-pickers";
import { Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';
const convertTo24Hour = (time12h) => {
    const [time, modifier] = time12h.split(" ");
    let [hours, minutes] = time.split(":");
    if (hours === "12")
        hours = "00";
    if (modifier === "PM")
        hours = (parseInt(hours, 10) + 12).toString();
    return `${hours.padStart(2, "0")}:${minutes}`;
};
const formatTime = (time24h) => {
    const [hours, minutes] = time24h.split(":");
    const hour = parseInt(hours, 10);
    const period = hour >= 12 ? "PM" : "AM";
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${period}`;
};
const Calendar = () => {
    const { user } = useAuth();
    const userId = user?.id;
    const [selectedDate, setSelectedDate] = useState(dayjs());
    const [startTime, setStartTime] = useState(null);
    const [endTime, setEndTime] = useState(null);
    const [booking, setBooking] = useState(false);
    const [upcoming, setUpcoming] = useState([]);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const [editDialogOpen, setEditDialogOpen] = useState(false);
    const [editingBooking, setEditingBooking] = useState(null);
    const [editDate, setEditDate] = useState(null);
    const [editStartTime, setEditStartTime] = useState(null);
    const [editEndTime, setEditEndTime] = useState(null);
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
    const [bookingToDelete, setBookingToDelete] = useState(null);
    useEffect(() => {
        if (userId)
            fetchUpcoming();
        // eslint-disable-next-line
    }, [userId]);
    const fetchUpcoming = async () => {
        if (!userId)
            return;
        try {
            const { data, error } = await supabase
                .from("bookings")
                .select("*")
                .eq("user_id", userId)
                .gte("date", dayjs().format("YYYY-MM-DD"))
                .order("date", { ascending: true });
            if (error)
                throw error;
            setUpcoming(data || []);
        }
        catch (err) {
            setUpcoming([]);
        }
    };
    const handleBook = async () => {
        setError(null);
        setSuccess(null);
        if (!selectedDate || !startTime || !endTime || !userId) {
            setError("Please fill in all fields.");
            return;
        }
        const start24 = startTime.format("HH:mm");
        const end24 = endTime.format("HH:mm");
        if (start24 >= end24) {
            setError("End time must be after start time.");
            return;
        }
        setBooking(true);
        try {
            await supabase.from("bookings").insert({
                date: selectedDate.format("YYYY-MM-DD"),
                start_time: start24,
                end_time: end24,
                user_id: userId,
            });
            setSuccess("Field booked successfully.");
            setStartTime(null);
            setEndTime(null);
            fetchUpcoming();
        }
        catch (err) {
            setError("Failed to book field. Please try again.");
        }
        finally {
            setBooking(false);
        }
    };
    const handleEdit = (booking) => {
        setEditingBooking(booking);
        setEditDate(dayjs(booking.date));
        setEditStartTime(dayjs(`2000-01-01T${booking.start_time}`));
        setEditEndTime(dayjs(`2000-01-01T${booking.end_time}`));
        setEditDialogOpen(true);
    };
    const handleUpdateBooking = async () => {
        setError(null);
        setSuccess(null);
        if (!editingBooking || !editDate || !editStartTime || !editEndTime) {
            setError("Please fill in all fields for update.");
            return;
        }
        const start24 = editStartTime.format("HH:mm");
        const end24 = editEndTime.format("HH:mm");
        if (start24 >= end24) {
            setError("End time must be after start time for update.");
            return;
        }
        setBooking(true);
        try {
            const { error } = await supabase
                .from("bookings")
                .update({
                date: editDate.format("YYYY-MM-DD"),
                start_time: start24,
                end_time: end24,
            })
                .eq("id", editingBooking.id);
            if (error)
                throw error;
            setSuccess("Booking updated successfully.");
            setEditDialogOpen(false);
            fetchUpcoming();
        }
        catch (err) {
            setError("Failed to update booking. Please try again.");
        }
        finally {
            setBooking(false);
        }
    };
    const handleDeleteConfirm = (booking) => {
        setBookingToDelete(booking);
        setDeleteConfirmOpen(true);
    };
    const handleDeleteBooking = async () => {
        setError(null);
        setSuccess(null);
        if (!bookingToDelete)
            return;
        setBooking(true);
        try {
            const { error } = await supabase
                .from("bookings")
                .delete()
                .eq("id", bookingToDelete.id);
            if (error)
                throw error;
            setSuccess("Booking deleted successfully.");
            setDeleteConfirmOpen(false);
            setBookingToDelete(null);
            fetchUpcoming();
        }
        catch (err) {
            setError("Failed to delete booking. Please try again.");
        }
        finally {
            setBooking(false);
        }
    };
    return (_jsxs(Box, { sx: { display: "flex", flexDirection: "column", alignItems: "center", width: "100%", py: 6, mt: 8 }, children: [_jsxs(Paper, { elevation: 3, sx: { p: 4, width: "100%", maxWidth: 500, mb: 4, background: "rgba(255,255,255,0.05)", borderRadius: 2 }, children: [_jsx(Typography, { variant: "h5", sx: { color: "#fff", mb: 3, textAlign: "center" }, children: "Book a Field" }), _jsxs(Stack, { spacing: 3, children: [_jsx(DatePicker, { label: "Select Date", value: selectedDate, onChange: setSelectedDate, disablePast: true, slotProps: {
                                    textField: {
                                        fullWidth: true,
                                        variant: "outlined",
                                        sx: {
                                            "& .MuiOutlinedInput-root": {
                                                color: "#fff",
                                                "& fieldset": { borderColor: "rgba(255,255,255,0.23)" },
                                                "&:hover fieldset": { borderColor: "rgba(255,255,255,0.5)" },
                                            },
                                            "& .MuiInputLabel-root": { color: "rgba(255,255,255,0.7)" },
                                        },
                                    },
                                } }), _jsx(TimePicker, { label: "Start Time", value: startTime, onChange: setStartTime, ampm: true, slotProps: {
                                    textField: {
                                        fullWidth: true,
                                        variant: "outlined",
                                        sx: {
                                            "& .MuiOutlinedInput-root": {
                                                color: "#fff",
                                                "& fieldset": { borderColor: "rgba(255,255,255,0.23)" },
                                                "&:hover fieldset": { borderColor: "rgba(255,255,255,0.5)" },
                                            },
                                            "& .MuiInputLabel-root": { color: "rgba(255,255,255,0.7)" },
                                        },
                                    },
                                } }), _jsx(TimePicker, { label: "End Time", value: endTime, onChange: setEndTime, ampm: true, slotProps: {
                                    textField: {
                                        fullWidth: true,
                                        variant: "outlined",
                                        sx: {
                                            "& .MuiOutlinedInput-root": {
                                                color: "#fff",
                                                "& fieldset": { borderColor: "rgba(255,255,255,0.23)" },
                                                "&:hover fieldset": { borderColor: "rgba(255,255,255,0.5)" },
                                            },
                                            "& .MuiInputLabel-root": { color: "rgba(255,255,255,0.7)" },
                                        },
                                    },
                                } }), _jsx(Button, { variant: "contained", onClick: handleBook, disabled: booking, sx: { mt: 2, background: "#F44336", '&:hover': { background: "#d32f2f" } }, fullWidth: true, children: booking ? _jsx(CircularProgress, { size: 24, color: "inherit" }) : "Book Field" }), error && _jsx(Alert, { severity: "error", children: error }), success && _jsx(Alert, { severity: "success", children: success })] })] }), _jsxs(Paper, { elevation: 1, sx: { p: 3, width: "100%", maxWidth: 500, background: "rgba(255,255,255,0.03)", borderRadius: 2 }, children: [_jsx(Typography, { variant: "h6", sx: { color: "#fff", mb: 2, textAlign: "center" }, children: "Your Upcoming Bookings" }), _jsx(Stack, { spacing: 2, children: upcoming.length === 0 ? (_jsx(Typography, { sx: { color: "rgba(255,255,255,0.7)", textAlign: "center" }, children: "No upcoming bookings" })) : (upcoming.map(booking => (_jsxs(Box, { sx: { background: "rgba(255,255,255,0.06)", borderRadius: 1, p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }, children: [_jsxs(Typography, { sx: { color: "#fff" }, children: [dayjs(booking.date).format("MMMM D, YYYY"), _jsx("br", {}), formatTime(booking.start_time), " - ", formatTime(booking.end_time)] }), _jsxs(Box, { children: [_jsx(IconButton, { onClick: () => handleEdit(booking), color: "inherit", children: _jsx(EditIcon, {}) }), _jsx(IconButton, { onClick: () => handleDeleteConfirm(booking), color: "inherit", children: _jsx(DeleteIcon, {}) })] })] }, booking.id)))) })] }), _jsxs(Dialog, { open: editDialogOpen, onClose: () => setEditDialogOpen(false), PaperProps: { sx: { background: '#1e1e1e', color: '#fff' } }, children: [_jsx(DialogTitle, { sx: { color: '#fff' }, children: "Edit Booking" }), _jsx(DialogContent, { children: _jsxs(Stack, { spacing: 2, sx: { mt: 2 }, children: [_jsx(DatePicker, { label: "Date", value: editDate, onChange: setEditDate, slotProps: {
                                        textField: {
                                            fullWidth: true,
                                            variant: "outlined",
                                            sx: {
                                                "& .MuiOutlinedInput-root": {
                                                    color: "#fff",
                                                    "& fieldset": { borderColor: "rgba(255,255,255,0.23)" },
                                                    "&:hover fieldset": { borderColor: "rgba(255,255,255,0.5)" },
                                                },
                                                "& .MuiInputLabel-root": { color: "rgba(255,255,255,0.7)" },
                                            },
                                        },
                                    } }), _jsx(TimePicker, { label: "Start Time", value: editStartTime, onChange: setEditStartTime, ampm: true, slotProps: {
                                        textField: {
                                            fullWidth: true,
                                            variant: "outlined",
                                            sx: {
                                                "& .MuiOutlinedInput-root": {
                                                    color: "#fff",
                                                    "& fieldset": { borderColor: "rgba(255,255,255,0.23)" },
                                                    "&:hover fieldset": { borderColor: "rgba(255,255,255,0.5)" },
                                                },
                                                "& .MuiInputLabel-root": { color: "rgba(255,255,255,0.7)" },
                                            },
                                        },
                                    } }), _jsx(TimePicker, { label: "End Time", value: editEndTime, onChange: setEditEndTime, ampm: true, slotProps: {
                                        textField: {
                                            fullWidth: true,
                                            variant: "outlined",
                                            sx: {
                                                "& .MuiOutlinedInput-root": {
                                                    color: "#fff",
                                                    "& fieldset": { borderColor: "rgba(255,255,255,0.23)" },
                                                    "&:hover fieldset": { borderColor: "rgba(255,255,255,0.5)" },
                                                },
                                                "& .MuiInputLabel-root": { color: "rgba(255,255,255,0.7)" },
                                            },
                                        },
                                    } }), error && _jsx(Alert, { severity: "error", children: error })] }) }), _jsxs(DialogActions, { children: [_jsx(Button, { onClick: () => setEditDialogOpen(false), sx: { color: '#fff' }, children: "Cancel" }), _jsx(Button, { onClick: handleUpdateBooking, variant: "contained", sx: { background: "#F44336", '&:hover': { background: "#d32f2f" } }, children: "Save" })] })] }), _jsxs(Dialog, { open: deleteConfirmOpen, onClose: () => setDeleteConfirmOpen(false), PaperProps: { sx: { background: '#1e1e1e', color: '#fff' } }, children: [_jsx(DialogTitle, { sx: { color: '#fff' }, children: "Confirm Deletion" }), _jsx(DialogContent, { children: _jsx(Typography, { sx: { color: '#fff' }, children: "Are you sure you want to delete this booking?" }) }), _jsxs(DialogActions, { children: [_jsx(Button, { onClick: () => setDeleteConfirmOpen(false), sx: { color: '#fff' }, children: "Cancel" }), _jsx(Button, { onClick: handleDeleteBooking, variant: "contained", sx: { background: "#F44336", '&:hover': { background: "#d32f2f" } }, children: "Delete" })] })] })] }));
};
export default Calendar;
