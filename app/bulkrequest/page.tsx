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

type BulkResultRow = {
  id: number | string;
  fullName: string;
  account_number: string;
  debitAccount: string;
  card_product: string;
  status: "SUCCESS" | "FAILED";
  message: string;
  card_request_payload?: unknown;
  card_request_wire_payload?: string;
  card_request_response?: unknown;
};

const SAMPLE_JSON = `[
  {
    "accountId": "1000010370616",
    "Title": "Mr",
    "District": "ADAMA DISTRICT",
    "BranchCode": "Hawas Branch",
    "DeliveryBranchCode": "Hawas Branch",
    "CardProduct": "404",
    "EmbossingName": "ADAMA DISTRICT"
  }
]`;

export default function BulkRequestPage() {
  const [jsonInput, setJsonInput] = useState(SAMPLE_JSON);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [results, setResults] = useState<BulkResultRow[]>([]);
  const [successCount, setSuccessCount] = useState(0);
  const [failureCount, setFailureCount] = useState(0);

  const totalCount = useMemo(() => results.length, [results]);

  const handleSubmit = async () => {
    setError("");
    setResults([]);
    setSuccessCount(0);
    setFailureCount(0);

    let parsed: unknown;
    try {
      parsed = JSON.parse(jsonInput);
    } catch {
      setError("Invalid JSON: please provide a valid JSON array.");
      return;
    }
    if (!Array.isArray(parsed)) {
      setError("Invalid input: root value must be a JSON array.");
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch("/api/bulk-card-request", {
        method: "POST",
        cache: "no-store",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ records: parsed }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        success?: boolean;
        message?: string;
        results?: BulkResultRow[];
        successCount?: number;
        failureCount?: number;
      };
      if (!res.ok || !data.success) {
        setError(data.message || "Bulk processing failed.");
        return;
      }
      const rows = Array.isArray(data.results) ? data.results : [];
      setResults(rows);
      setSuccessCount(Number(data.successCount ?? 0));
      setFailureCount(Number(data.failureCount ?? 0));
    } catch {
      setError("Request failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 py-10">
      <Box className="mx-auto w-full max-w-7xl px-4">
        <Typography variant="h4" className="mb-2 font-semibold text-slate-900">
          Bulk Card Request
        </Typography>
        <Typography variant="body2" className="mb-6 text-slate-600">
          Paste a JSON array and process card request + card-to-CBS in bulk.
        </Typography>

        <Paper className="mb-6 p-4">
          <TextField
            label="Bulk JSON Input"
            value={jsonInput}
            onChange={(e) => setJsonInput(e.target.value)}
            multiline
            minRows={16}
            fullWidth
            placeholder='[{"accountId":"1000010370616","Title":"Mr","District":"ADAMA DISTRICT","BranchCode":"Hawas Branch","DeliveryBranchCode":"Hawas Branch","CardProduct":"404","EmbossingName":"ADAMA DISTRICT"}]'
          />
          <Box className="mt-4 flex items-center gap-3">
            <Button
              variant="contained"
              onClick={handleSubmit}
              disabled={isLoading}
              className="normal-case"
            >
              {isLoading ? "Processing..." : "Process Bulk Request"}
            </Button>
            {isLoading ? <CircularProgress size={22} /> : null}
          </Box>
          {error ? (
            <Alert severity="error" className="mt-4">
              {error}
            </Alert>
          ) : null}
        </Paper>

        {(totalCount > 0 || successCount > 0 || failureCount > 0) && (
          <Box className="mb-4 flex flex-wrap gap-3">
            <Alert severity="info">Total: {totalCount}</Alert>
            <Alert severity="success">Success: {successCount}</Alert>
            <Alert severity="warning">Failed: {failureCount}</Alert>
          </Box>
        )}

        <TableContainer component={Paper}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>id</TableCell>
                <TableCell>fullName</TableCell>
                <TableCell>account_number</TableCell>
                <TableCell>debitAccount</TableCell>
                <TableCell>card_product</TableCell>
                <TableCell>status</TableCell>
                <TableCell>message</TableCell>
                <TableCell>card_request_payload</TableCell>
                <TableCell>card_request_wire_payload</TableCell>
                <TableCell>card_request_response</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {results.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} className="text-slate-500">
                    No results yet.
                  </TableCell>
                </TableRow>
              ) : (
                results.map((row, idx) => (
                  <TableRow key={`${row.id}-${idx}`}>
                    <TableCell>{row.id}</TableCell>
                    <TableCell>{row.fullName}</TableCell>
                    <TableCell>{row.account_number}</TableCell>
                    <TableCell>{row.debitAccount}</TableCell>
                    <TableCell>{row.card_product}</TableCell>
                    <TableCell>
                      <span
                        className={
                          row.status === "SUCCESS" ? "text-green-700" : "text-red-700"
                        }
                      >
                        {row.status}
                      </span>
                    </TableCell>
                    <TableCell>{row.message}</TableCell>
                    <TableCell>
                      <pre className="max-w-[22rem] overflow-auto whitespace-pre-wrap text-xs">
                        {JSON.stringify(row.card_request_payload ?? null, null, 2)}
                      </pre>
                    </TableCell>
                    <TableCell>
                      <pre className="max-w-[22rem] overflow-auto whitespace-pre-wrap text-xs">
                        {row.card_request_wire_payload ?? "null"}
                      </pre>
                    </TableCell>
                    <TableCell>
                      <pre className="max-w-[22rem] overflow-auto whitespace-pre-wrap text-xs">
                        {JSON.stringify(row.card_request_response ?? null, null, 2)}
                      </pre>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
    </main>
  );
}
