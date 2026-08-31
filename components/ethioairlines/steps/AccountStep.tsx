"use client";

import {
  Box,
  Button,
  CircularProgress,
  InputAdornment,
  TextField,
} from "@mui/material";
import { Landmark, Send } from "lucide-react";
import {
  numericFieldSx,
  primaryButtonSx,
} from "@/lib/ethioairlines/checkoutFieldStyles";

export type AccountStepProps = {
  accountNumber: string;
  onAccountNumberChange: (value: string) => void;
  touched: boolean;
  onBlur: () => void;
  isSending: boolean;
  canSubmit: boolean;
  onSubmit: () => void;
};

export default function AccountStep({
  accountNumber,
  onAccountNumberChange,
  touched,
  onBlur,
  isSending,
  canSubmit,
  onSubmit,
}: AccountStepProps) {
  const hasError = touched && accountNumber.length > 0 && !canSubmit;

  return (
    <Box
      component="form"
      onSubmit={(e) => {
        e.preventDefault();
        if (canSubmit && !isSending) onSubmit();
      }}
      className="space-y-4"
    >
      <TextField
        fullWidth
        label="Account number"
        value={accountNumber}
        onChange={(e) =>
          onAccountNumberChange(e.target.value.replace(/\D/g, "").slice(0, 13))
        }
        onBlur={onBlur}
        error={hasError}
        helperText={
          hasError
            ? "Account number must be exactly 13 digits."
            : "Enter the 13-digit account you want to pay from."
        }
        disabled={isSending}
        placeholder="1045500049787"
        inputProps={{
          inputMode: "numeric",
          enterKeyHint: "go",
          maxLength: 13,
          autoComplete: "off",
          "aria-label": "13-digit account number",
        }}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <Landmark size={18} className="text-slate-400" />
            </InputAdornment>
          ),
        }}
        sx={numericFieldSx}
      />

      <Button
        type="submit"
        fullWidth
        variant="contained"
        disabled={!canSubmit || isSending}
        sx={primaryButtonSx}
      >
        {isSending ? (
          <>
            <CircularProgress size={20} thickness={4} color="inherit" />
            Sending code…
          </>
        ) : (
          <>
            <Send size={17} />
            Send verification code
          </>
        )}
      </Button>
    </Box>
  );
}
