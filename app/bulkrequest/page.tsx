"use client";

import { useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import type { BulkProcessResponse, BulkRowResult } from "@/lib/bulkrequest/bulkRequestTypes";

const SAMPLE_INPUT = `[
  {
    "id": 603,
    "first_name": "EDLAWIT MANYAZEWAL LULE",
    "title": "Ms",
    "customer_code": "1260406056",
    "branch_code": "10246",
    "card_product": "403",
    "district": "DIREDEWA",
    "region": "14",
    "preferred_language": "EN",
    "customer_type": "0",
    "debitAccount": "1024600302868"
  }
]`;

export default function BulkRequestPage() {
  const [inputText, setInputText] = useState(SAMPLE_INPUT);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [rows, setRows] = useState<BulkRowResult[]>([]);
  const [summary, setSummary] = useState({ total: 0, ok: 0, failed: 0 });

  const hasResults = rows.length > 0;

  const parsedCount = useMemo(() => {
    try {
      const parsed = JSON.parse(inputText);
      return Array.isArray(parsed) ? parsed.length : 0;
    } catch {
      return 0;
    }
  }, [inputText]);

  const handleSubmit = async () => {
    setErrorMessage("");
    setRows([]);
    setSummary({ total: 0, ok: 0, failed: 0 });
    setIsSubmitting(true);

    try {
      const parsed = JSON.parse(inputText) as unknown;
      if (!Array.isArray(parsed)) {
        setErrorMessage("Input must be a JSON array.");
        return;
      }

      const res = await fetch("/api/bulkrequest", {
        method: "POST",
        cache: "no-store",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(parsed),
      });

      const json = (await res.json().catch(() => ({}))) as BulkProcessResponse;
      if (!res.ok || !json.success) {
        setErrorMessage(
          json.success ? "Bulk request failed." : json.error || "Bulk request failed."
        );
        return;
      }

      setSummary(json.summary);
      setRows(json.rows);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Invalid JSON input.";
      setErrorMessage(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#F6FAFB] py-8">
      <Box className="mx-auto w-full max-w-6xl px-4">
        <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
          Bulk Card Request
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
          Paste a JSON array and process each row through card request and card-to-cbs.
        </Typography>

        <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
          <TextField
            label="Bulk JSON Input"
            multiline
            minRows={16}
            maxRows={30}
            fullWidth
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder='[{"id":603,"debitAccount":"..."}]'
            disabled={isSubmitting}
          />

          <Box sx={{ display: "flex", gap: 2, alignItems: "center", mt: 2 }}>
            <Button variant="contained" onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <CircularProgress size={18} sx={{ mr: 1, color: "#fff" }} />
                  Processing...
                </>
              ) : (
                "Process Bulk Request"
              )}
            </Button>
            <Typography variant="body2" color="text.secondary">
              Parsed rows: {parsedCount}
            </Typography>
          </Box>

          {errorMessage ? (
            <Alert severity="error" sx={{ mt: 2 }}>
              {errorMessage}
            </Alert>
          ) : null}
        </Paper>

        {hasResults ? (
          <Paper elevation={2} sx={{ p: 2 }}>
            <Typography variant="h6" sx={{ mb: 1 }}>
              Processing Result
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Total: {summary.total} | Success: {summary.ok} | Failed: {summary.failed}
            </Typography>

            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>#</TableCell>
                    <TableCell>Input ID</TableCell>
                    <TableCell>Debit Account</TableCell>
                    <TableCell>Branch Code</TableCell>
                    <TableCell>Card Product Used</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Step</TableCell>
                    <TableCell>Message</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {rows.map((row) => (
                    <TableRow key={`${row.index}-${row.inputId}`}>
                      <TableCell>{row.index + 1}</TableCell>
                      <TableCell>{row.inputId}</TableCell>
                      <TableCell>{row.debitAccount}</TableCell>
                      <TableCell>{row.branchCode}</TableCell>
                      <TableCell>{row.flippedCardProduct}</TableCell>
                      <TableCell
                        sx={{
                          fontWeight: 700,
                          color: row.status === "ok" ? "success.main" : "error.main",
                        }}
                      >
                        {row.status}
                      </TableCell>
                      <TableCell>{row.step}</TableCell>
                      <TableCell>{row.message}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        ) : null}
      </Box>
    </main>
  );
}
