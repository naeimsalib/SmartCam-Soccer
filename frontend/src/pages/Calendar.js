import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from "react";
import { Box, Paper, Typography, Button, TextField, MenuItem, CircularProgress, Container, Grid, Card, CardContent, CardActions, IconButton, Stack, InputAdornment, Dialog, DialogTitle, DialogContent, DialogActions, } from "@mui/material";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import dayjs from "dayjs";
import { supabase } from "../supabaseClient";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import Navbar from "../components/Navbar";
const generateTimeOptions = () => {
    const times = [];
    for (let hour = 0; hour < 24; hour++) {
        for (let min = 0; min < 60; min += 5) {
            const hour12 = hour % 12 === 0 ? 12 : hour % 12;
            const ampm = hour < 12 ? "AM" : "PM";
            const label = `${hour12.toString().padStart(2, "0")}:${min
                .toString()
                .padStart(2, "0")} ${ampm}`;
            const value = `${hour.toString().padStart(2, "0")}:${min
                .toString()
                .padStart(2, "0")}`;
            times.push({ label, value });
        }
    }
    return times;
};
const timeOptions = generateTimeOptions();
const Calendar = () => {
    const [selectedDate, setSelectedDate] = useState(dayjs());
    const [startTime, setStartTime] = useState("");
    const [endTime, setEndTime] = useState("");
    const [booking, setBooking] = useState(false);
    const [upcoming, setUpcoming] = useState([]);
    const [loading, setLoading] = useState(false);
    const [editId, setEditId] = useState(null);
    const [userId, setUserId] = useState(null);
    const [quickBookOpen, setQuickBookOpen] = useState(false);
    const [quickBookDuration, setQuickBookDuration] = useState("60");
    useEffect(() => {
        setLoading(true);
        const fetchUpcoming = async () => {
            const { data } = await supabase
                .from("bookings")
                .select()
                .gte("date", dayjs().format("YYYY-MM-DD"))
                .order("date", { ascending: true })
                .order("start_time", { ascending: true });
            setUpcoming(data || []);
            setLoading(false);
        };
        fetchUpcoming();
    }, [booking]);
    useEffect(() => {
        const fetchUserId = async () => {
            const { data: { session }, } = await supabase.auth.getSession();
            setUserId(session?.user?.id || null);
        };
        fetchUserId();
    }, []);
    const handleBook = async () => {
        if (!selectedDate ||
            !startTime ||
            !endTime ||
            startTime >= endTime ||
            !userId)
            return;
        setBooking(true);
        const dateStr = selectedDate.format("YYYY-MM-DD");
        if (editId) {
            await supabase
                .from("bookings")
                .update({
                date: dateStr,
                start_time: startTime,
                end_time: endTime,
                user_id: userId,
            })
                .eq("id", editId);
            setEditId(null);
        }
        else {
            await supabase.from("bookings").insert({
                date: dateStr,
                start_time: startTime,
                end_time: endTime,
                user_id: userId,
            });
        }
        setBooking(false);
        setStartTime("");
        setEndTime("");
    };
    const handleDelete = async (id) => {
        setBooking(true);
        await supabase.from("bookings").delete().eq("id", id);
        setBooking(false);
    };
    const handleEdit = (row) => {
        setSelectedDate(dayjs(row.date));
        setStartTime(row.start_time);
        setEndTime(row.end_time);
        setEditId(row.id);
    };
    function formatTime12(time24) {
        const [hourStr, minStr] = time24.split(":");
        let hour = parseInt(hourStr, 10);
        const min = minStr;
        const ampm = hour < 12 ? "AM" : "PM";
        hour = hour % 12 === 0 ? 12 : hour % 12;
        return `${hour.toString().padStart(2, "0")}:${min} ${ampm}`;
    }
    const handleQuickBook = async () => {
        if (!selectedDate || !userId)
            return;
        setBooking(true);
        const dateStr = selectedDate.format("YYYY-MM-DD");
        const now = dayjs();
        const startTimeStr = now.format("HH:mm");
        const endTimeStr = now
            .add(parseInt(quickBookDuration), "minutes")
            .format("HH:mm");
        await supabase.from("bookings").insert({
            date: dateStr,
            start_time: startTimeStr,
            end_time: endTimeStr,
            user_id: userId,
        });
        setBooking(false);
        setQuickBookOpen(false);
    };
    return (_jsx(LocalizationProvider, { dateAdapter: AdapterDayjs, children: _jsxs(Box, { sx: {
                minHeight: "100vh",
                width: "100vw",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                background: "linear-gradient(135deg, #e3f2fd 0%, #ffffff 100%)",
                py: 4,
            }, children: [_jsx(Navbar, {}), _jsx(Container, { maxWidth: "sm", sx: { mt: 10 }, children: _jsxs(Grid, { container: true, spacing: 4, justifyContent: "center", children: [_jsx(Grid, { item: true, xs: 12, children: _jsx(Button, { variant: "contained", color: "secondary", fullWidth: true, onClick: () => setQuickBookOpen(true), sx: { py: 2, fontWeight: 600, fontSize: 18 }, children: "Quick Book Now" }) }), _jsxs(Dialog, { open: quickBookOpen, onClose: () => setQuickBookOpen(false), children: [_jsx(DialogTitle, { children: "Quick Book" }), _jsx(DialogContent, { children: _jsx(Stack, { spacing: 3, sx: { mt: 2 }, children: _jsxs(TextField, { select: true, label: "Duration", value: quickBookDuration, onChange: (e) => setQuickBookDuration(e.target.value), fullWidth: true, children: [_jsx(MenuItem, { value: "1", children: "1 minute" }), _jsx(MenuItem, { value: "30", children: "30 minutes" }), _jsx(MenuItem, { value: "60", children: "1 hour" }), _jsx(MenuItem, { value: "90", children: "1.5 hours" }), _jsx(MenuItem, { value: "120", children: "2 hours" })] }) }) }), _jsxs(DialogActions, { children: [_jsx(Button, { onClick: () => setQuickBookOpen(false), children: "Cancel" }), _jsx(Button, { onClick: handleQuickBook, variant: "contained", disabled: booking, children: booking ? "Booking..." : "Book Now" })] })] }), _jsx(Grid, { item: true, xs: 12, children: _jsxs(Paper, { elevation: 3, sx: { p: 4, borderRadius: 4 }, children: [_jsx(Typography, { variant: "h5", align: "center", mb: 3, fontWeight: 500, children: "Book a Field" }), _jsxs(Stack, { spacing: 3, children: [_jsx(DatePicker, { label: "Date", value: selectedDate, onChange: setSelectedDate, disablePast: true, slotProps: {
                                                        textField: {
                                                            fullWidth: true,
                                                            variant: "outlined",
                                                        },
                                                    } }), _jsx(TextField, { label: "Start Time", type: "time", value: startTime, onChange: (e) => setStartTime(e.target.value), fullWidth: true, variant: "outlined", InputLabelProps: { shrink: true }, inputProps: { step: 300 }, InputProps: {
                                                        startAdornment: (_jsx(InputAdornment, { position: "start", children: _jsx(AccessTimeIcon, { sx: { color: "text.secondary" } }) })),
                                                    }, helperText: "Enter time in 12-hour format (e.g., 01:30 PM)" }), _jsx(TextField, { label: "End Time", type: "time", value: endTime, onChange: (e) => setEndTime(e.target.value), fullWidth: true, variant: "outlined", InputLabelProps: { shrink: true }, inputProps: { step: 300 }, InputProps: {
                                                        startAdornment: (_jsx(InputAdornment, { position: "start", children: _jsx(AccessTimeIcon, { sx: { color: "text.secondary" } }) })),
                                                    }, helperText: "Enter time in 12-hour format (e.g., 03:45 PM)" }), _jsx(Button, { variant: "contained", color: "primary", fullWidth: true, disabled: !selectedDate ||
                                                        !startTime ||
                                                        !endTime ||
                                                        startTime >= endTime ||
                                                        booking, onClick: handleBook, sx: { mt: 2, py: 1.5, fontWeight: 600, fontSize: 18 }, children: booking
                                                        ? "Booking..."
                                                        : editId
                                                            ? "Update Booking"
                                                            : "Book Field" })] })] }) }), _jsx(Grid, { item: true, xs: 12, mt: 4, children: _jsxs(Paper, { elevation: 3, sx: { p: 4, borderRadius: 4 }, children: [_jsx(Typography, { variant: "h5", align: "center", mb: 3, fontWeight: 500, children: "Upcoming Appointments" }), loading ? (_jsx(Box, { display: "flex", justifyContent: "center", my: 4, children: _jsx(CircularProgress, {}) })) : upcoming.length === 0 ? (_jsx(Typography, { color: "text.secondary", align: "center", children: "No upcoming bookings." })) : (_jsx(Stack, { spacing: 2, children: upcoming.map((row) => (_jsxs(Card, { elevation: 2, sx: { borderRadius: 3, background: "#f7fafc" }, children: [_jsxs(CardContent, { children: [_jsx(Typography, { variant: "subtitle1", fontWeight: 600, gutterBottom: true, children: dayjs(row.date).format("MMMM D, YYYY") }), _jsxs(Box, { display: "flex", alignItems: "center", gap: 1, children: [_jsx(AccessTimeIcon, { color: "primary", fontSize: "small" }), _jsxs(Typography, { fontWeight: 500, children: [formatTime12(row.start_time), " -", " ", formatTime12(row.end_time)] })] })] }), _jsxs(CardActions, { children: [_jsx(IconButton, { size: "small", color: "primary", onClick: () => handleEdit(row), children: _jsx(EditIcon, {}) }), _jsx(IconButton, { size: "small", color: "error", onClick: () => handleDelete(row.id), children: _jsx(DeleteIcon, {}) })] })] }, row.id))) }))] }) })] }) })] }) }));
};
export default Calendar;
