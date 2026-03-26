"use client";

import React from "react";
import {
  Stepper,
  Step,
  StepLabel,
  Box,
  useTheme,
  useMediaQuery,
  LinearProgress,
  Typography,
} from "@mui/material";

interface ReusableStepperProps {
  steps: string[];
  activeStep: number;
  completedSteps?: boolean[];
  showProgress?: boolean;
}

export const ReusableStepper: React.FC<ReusableStepperProps> = ({
  steps,
  activeStep,
  completedSteps = [],
  showProgress = false,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const progressPercentage =
    completedSteps.length > 0
      ? Math.round(
          (completedSteps.filter(Boolean).length / completedSteps.length) * 100
        )
      : 0;

  return (
    <Box className="w-full" sx={{ overflowX: "auto", py: 1 }}>
      {showProgress && completedSteps.length > 0 && (
        <Box mb={3} textAlign="center">
          <Typography variant="body2" color="text.secondary" mb={1}>
            Overall Progress: {progressPercentage}%
          </Typography>
          <LinearProgress
            variant="determinate"
            value={progressPercentage}
            sx={{
              height: 8,
              borderRadius: 4,
              background: "#e0f7fa",
              "& .MuiLinearProgress-bar": {
                background: "#00adef",
                borderRadius: 4,
              },
            }}
          />
        </Box>
      )}

      <Stepper
        activeStep={activeStep}
        alternativeLabel
        orientation="horizontal"
        sx={{
          minWidth: "100%",
          overflowX: "auto",
          padding: "0 16px",
          scrollbarWidth: "none",
          "&::-webkit-scrollbar": {
            display: "none",
          },
          "& .MuiStep-root": {
            padding: "0 4px",
            minWidth: isMobile ? "60px" : "80px",
          },
          "& .MuiStepLabel-root": {
            flexDirection: "column",
            alignItems: "center",
            gap: 0,
          },
          "& .MuiStepIcon-root": {
            color: "#e0e0e0",
            fontSize: isMobile ? "18px" : "24px",
            "&.Mui-active": {
              color: "rgba(0, 173, 239, 0.8)",
            },
            "&.Mui-completed": {
              color: "rgba(0, 173, 239, 0.8)",
            },
          },
          "& .MuiStepLabel-label": {
            fontSize: isMobile ? "0.625rem" : "0.8rem",
            marginTop: isMobile ? "2px" : "4px",
            color: "#666666",
            textAlign: "center",
            lineHeight: 1.2,
            "&.Mui-active": {
              color: "rgba(0, 173, 239, 0.8)",
              fontWeight: 600,
            },
            "&.Mui-completed": {
              color: "rgba(0, 173, 239, 0.8)",
              fontWeight: 600,
            },
          },
          "& .MuiStepConnector-root": {
            top: isMobile ? "10px" : "12px",
            left: "calc(-50% + 20px)",
            right: "calc(50% + 20px)",
            "& .MuiStepConnector-line": {
              borderColor: "#e0e0e0",
              borderTopWidth: 2,
            },
          },
          "& .MuiStepConnector-root.Mui-active": {
            "& .MuiStepConnector-line": {
              borderColor: "rgba(0, 173, 239, 0.8)",
            },
          },
          "& .MuiStepConnector-root.Mui-completed": {
            "& .MuiStepConnector-line": {
              borderColor: "rgba(0, 173, 239, 0.8)",
            },
          },
        }}
      >
        {steps.map((label) => (
          <Step key={label}>
            <StepLabel
              sx={{
                "& .MuiStepLabel-iconContainer": {
                  paddingRight: 0,
                },
                "& .MuiStepLabel-label": {
                  fontSize: isMobile ? "0.625rem" : "0.8rem",
                  marginTop: isMobile ? "2px" : "4px",
                  textAlign: "center",
                  lineHeight: 1.2,
                },
              }}
            >
              {label}
            </StepLabel>
          </Step>
        ))}
      </Stepper>
    </Box>
  );
};
