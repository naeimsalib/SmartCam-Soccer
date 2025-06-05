import React, { useState, useEffect } from "react";
import {
  Box,
  Paper,
  Typography,
  Button,
  TextField,
  MenuItem,
  CircularProgress,
  Container,
  Grid,
  Card,
  CardContent,
  CardActions,
  IconButton,
  Stack,
  InputAdornment,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import dayjs, { Dayjs } from "dayjs";
import { supabase } from "../supabaseClient";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import AccessTimeIcon from "@mui/icons-material/AccessTime";

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
  const [selectedDate, setSelectedDate] = useState<Dayjs | null>(dayjs());
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [booking, setBooking] = useState(false);
  const [upcoming, setUpcoming] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
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
      const {
        data: { session },
      } = await supabase.auth.getSession();
      setUserId(session?.user?.id || null);
    };
    fetchUserId();
  }, []);

  const handleBook = async () => {
    if (
      !selectedDate ||
      !startTime ||
      !endTime ||
      startTime >= endTime ||
      !userId
    )
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
    } else {
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

  const handleDelete = async (id: string) => {
    setBooking(true);
    await supabase.from("bookings").delete().eq("id", id);
    setBooking(false);
  };

  const handleEdit = (row: any) => {
    setSelectedDate(dayjs(row.date));
    setStartTime(row.start_time);
    setEndTime(row.end_time);
    setEditId(row.id);
  };

  function formatTime12(time24: string) {
    const [hourStr, minStr] = time24.split(":");
    let hour = parseInt(hourStr, 10);
    const min = minStr;
    const ampm = hour < 12 ? "AM" : "PM";
    hour = hour % 12 === 0 ? 12 : hour % 12;
    return `${hour.toString().padStart(2, "0")}:${min} ${ampm}`;
  }

  const handleQuickBook = async () => {
    if (!selectedDate || !userId) return;
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

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Box
        sx={{
          minHeight: "100vh",
          width: "100vw",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          background: "linear-gradient(135deg, #e3f2fd 0%, #ffffff 100%)",
          py: 4,
          mt: 10,
        }}
      >
        <Container maxWidth="sm">
          <Grid container spacing={4} justifyContent="center">
            {/* Quick Book Button */}
            <Grid item xs={12}>
              <Button
                variant="contained"
                color="secondary"
                fullWidth
                onClick={() => setQuickBookOpen(true)}
                sx={{ py: 2, fontWeight: 600, fontSize: 18 }}
              >
                Quick Book Now
              </Button>
            </Grid>

            {/* Quick Book Dialog */}
            <Dialog
              open={quickBookOpen}
              onClose={() => setQuickBookOpen(false)}
            >
              <DialogTitle>Quick Book</DialogTitle>
              <DialogContent>
                <Stack spacing={3} sx={{ mt: 2 }}>
                  <TextField
                    select
                    label="Duration"
                    value={quickBookDuration}
                    onChange={(e) => setQuickBookDuration(e.target.value)}
                    fullWidth
                  >
                    <MenuItem value="1">1 minute</MenuItem>
                    <MenuItem value="30">30 minutes</MenuItem>
                    <MenuItem value="60">1 hour</MenuItem>
                    <MenuItem value="90">1.5 hours</MenuItem>
                    <MenuItem value="120">2 hours</MenuItem>
                  </TextField>
                </Stack>
              </DialogContent>
              <DialogActions>
                <Button onClick={() => setQuickBookOpen(false)}>Cancel</Button>
                <Button
                  onClick={handleQuickBook}
                  variant="contained"
                  disabled={booking}
                >
                  {booking ? "Booking..." : "Book Now"}
                </Button>
              </DialogActions>
            </Dialog>

            {/* Booking Form */}
            <Grid item xs={12}>
              <Paper elevation={3} sx={{ p: 4, borderRadius: 4 }}>
                <Typography variant="h5" align="center" mb={3} fontWeight={500}>
                  Book a Field
                </Typography>
                <Stack spacing={3}>
                  <DatePicker
                    label="Date"
                    value={selectedDate}
                    onChange={setSelectedDate}
                    disablePast
                    slotProps={{
                      textField: {
                        fullWidth: true,
                        variant: "outlined",
                      },
                    }}
                  />
                  <TextField
                    label="Start Time"
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    fullWidth
                    variant="outlined"
                    InputLabelProps={{ shrink: true }}
                    inputProps={{ step: 300 }}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <AccessTimeIcon sx={{ color: "text.secondary" }} />
                        </InputAdornment>
                      ),
                    }}
                    helperText="Enter time in 12-hour format (e.g., 01:30 PM)"
                  />
                  <TextField
                    label="End Time"
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    fullWidth
                    variant="outlined"
                    InputLabelProps={{ shrink: true }}
                    inputProps={{ step: 300 }}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <AccessTimeIcon sx={{ color: "text.secondary" }} />
                        </InputAdornment>
                      ),
                    }}
                    helperText="Enter time in 12-hour format (e.g., 03:45 PM)"
                  />
                  <Button
                    variant="contained"
                    color="primary"
                    fullWidth
                    disabled={
                      !selectedDate ||
                      !startTime ||
                      !endTime ||
                      startTime >= endTime ||
                      booking
                    }
                    onClick={handleBook}
                    sx={{ mt: 2, py: 1.5, fontWeight: 600, fontSize: 18 }}
                  >
                    {booking
                      ? "Booking..."
                      : editId
                      ? "Update Booking"
                      : "Book Field"}
                  </Button>
                </Stack>
              </Paper>
            </Grid>

            {/* Upcoming Appointments */}
            <Grid item xs={12} mt={4}>
              <Paper elevation={3} sx={{ p: 4, borderRadius: 4 }}>
                <Typography variant="h5" align="center" mb={3} fontWeight={500}>
                  Upcoming Appointments
                </Typography>
                {loading ? (
                  <Box display="flex" justifyContent="center" my={4}>
                    <CircularProgress />
                  </Box>
                ) : upcoming.length === 0 ? (
                  <Typography color="text.secondary" align="center">
                    No upcoming bookings.
                  </Typography>
                ) : (
                  <Stack spacing={2}>
                    {upcoming.map((row) => (
                      <Card
                        key={row.id}
                        elevation={2}
                        sx={{ borderRadius: 3, background: "#f7fafc" }}
                      >
                        <CardContent>
                          <Typography
                            variant="subtitle1"
                            fontWeight={600}
                            gutterBottom
                          >
                            {dayjs(row.date).format("MMMM D, YYYY")}
                          </Typography>
                          <Box display="flex" alignItems="center" gap={1}>
                            <AccessTimeIcon color="primary" fontSize="small" />
                            <Typography fontWeight={500}>
                              {formatTime12(row.start_time)} -{" "}
                              {formatTime12(row.end_time)}
                            </Typography>
                          </Box>
                        </CardContent>
                        <CardActions>
                          <IconButton
                            size="small"
                            color="primary"
                            onClick={() => handleEdit(row)}
                          >
                            <EditIcon />
                          </IconButton>
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => handleDelete(row.id)}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </CardActions>
                      </Card>
                    ))}
                  </Stack>
                )}
              </Paper>
            </Grid>
          </Grid>
        </Container>
      </Box>
    </LocalizationProvider>
  );
};

export default Calendar;
