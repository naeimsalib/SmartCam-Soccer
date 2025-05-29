import React, { useState, useEffect } from "react";
import {
  Box,
  Paper,
  Typography,
  Button,
  TextField,
  MenuItem,
  CircularProgress,
} from "@mui/material";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import dayjs, { Dayjs } from "dayjs";
import { supabase } from "../supabaseClient";

const generateTimeOptions = () => {
  const times = [];
  for (let hour = 0; hour < 24; hour++) {
    for (let min = 0; min < 60; min += 5) {
      const label = `${hour.toString().padStart(2, "0")}:${min
        .toString()
        .padStart(2, "0")}`;
      times.push(label);
    }
  }
  return times;
};

const timeOptions = generateTimeOptions();

const Calendar = () => {
  console.log("Calendar component rendered");
  const [selectedDate, setSelectedDate] = useState<Dayjs | null>(dayjs());
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [booking, setBooking] = useState(false);
  const [upcoming, setUpcoming] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

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
    // Fetch user id from Supabase Auth
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
      // Update existing booking
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
      // Insert new booking
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

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Box
        sx={{
          minHeight: "100vh",
          width: "100vw",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #e3f2fd 0%, #ffffff 100%)",
        }}
      >
        <Paper elevation={3} sx={{ p: 5, minWidth: 350, maxWidth: 400 }}>
          <Typography variant="h5" align="center" mb={3} fontWeight={500}>
            Book a Field
          </Typography>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <DatePicker
              label="Date"
              value={selectedDate}
              onChange={setSelectedDate}
              disablePast
              sx={{ mb: 2 }}
              slotProps={{
                textField: {
                  id: "date-picker",
                  inputProps: { id: "date-picker" },
                },
              }}
            />
            <TextField
              id="start-time"
              name="start-time"
              label="Start Time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              fullWidth
              type="time"
              inputProps={{
                id: "start-time",
                step: 300, // 5 min steps
                "aria-label": "Enter start time",
              }}
            ></TextField>
            <TextField
              id="end-time"
              name="end-time"
              label="End Time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              fullWidth
              type="time"
              inputProps={{
                id: "end-time",
                step: 300, // 5 min steps
                "aria-label": "Enter end time",
              }}
            ></TextField>
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
              sx={{ mt: 2 }}
              id="book-button"
              name="book-button"
            >
              {booking ? "Booking..." : "BOOK FIELD"}
            </Button>
          </Box>
          <Box sx={{ mt: 4 }}>
            <Typography variant="h6" mb={1}>
              Upcoming Appointments
            </Typography>
            {loading ? (
              <CircularProgress sx={{ my: 2 }} />
            ) : upcoming.length === 0 ? (
              <Typography color="text.secondary">
                No upcoming bookings.
              </Typography>
            ) : (
              upcoming.map((row, idx) => (
                <Box
                  key={row.id}
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    mb: 1,
                  }}
                >
                  <Typography>
                    {row.date} — {row.start_time} to {row.end_time}
                  </Typography>
                  <Box>
                    <Button
                      size="small"
                      color="primary"
                      onClick={() => handleEdit(row)}
                      sx={{ mr: 1 }}
                    >
                      Edit
                    </Button>
                    <Button
                      size="small"
                      color="error"
                      onClick={() => handleDelete(row.id)}
                    >
                      Delete
                    </Button>
                  </Box>
                </Box>
              ))
            )}
          </Box>
        </Paper>
      </Box>
    </LocalizationProvider>
  );
};

export default Calendar;
