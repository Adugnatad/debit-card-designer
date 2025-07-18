import { useEffect, useState } from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
import type { CardDesign } from "@/components/card-designer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { useMutation, useQuery } from "@tanstack/react-query";
import { orderPayload, SendOrderData } from "@/lib/apis/order_api";
import { useToast } from "@/hooks/use-toast";
import { LoadingScreen } from "./loading-screen";
import { useParams, useRouter, usePathname } from "next/navigation";
import MapComponent from "./map-component";
import { Location } from "@/lib/apis/map_apis";

interface OrderFormProps {
  design: any;
  onBackToDesign: () => void;
  cardDesign: CardDesign;
  triggerScreenshot: () => Promise<string>;
}

const validationSchema = Yup.object({
  fullName: Yup.string()
    .matches(/^[a-zA-Z\s]+$/, "Full Name must only contain letters and spaces")
    .max(30, "Full Name must be at most 30 characters")
    .required("Full Name is required"),
  email: Yup.string()
    .email("Invalid email address")
    .max(30, "Email must be at most 30 characters")
    .required("Email is required"),
  phone: Yup.string()
    .matches(/^(\+251|0)?9\d{8}$/, "Phone number is not valid")
    .required("Phone number is required"),
  agreeToTerms: Yup.boolean().oneOf(
    [true],
    "You must accept the terms and conditions"
  ),
  orderType: Yup.string(),
  account: Yup.string().required("Account selection is required"),
  pickup_location: Yup.string().required("Pickup location is required"),
  groupPhones: Yup.array()
    .of(Yup.string().matches(/^(\+251|0)?9\d{8}$/, "Phone number is not valid"))
    .when("orderType", {
      is: "Group",
      then: (schema) =>
        schema.required("At least one phone number is required"),
      otherwise: (schema) => schema.notRequired(),
    }),
});

export function OrderForm({
  design,
  onBackToDesign,
  cardDesign,
  triggerScreenshot,
}: OrderFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isModalVisible, setModalVisible] = useState(false);
  const [error, setError] = useState("");
  const [isOtpVerified, setIsOtpVerified] = useState(false);
  const [id, setId] = useState("");
  const [sessionToken, setSessionToken] = useState("");
  const [accounts, setAccounts] = useState<
    { id: string; accountNumber: string }[]
  >([]);
  const { toast } = useToast();
  const [otpSendError, setOtpSendError] = useState("");
  const [resendTimer, setResendTimer] = useState(120);
  const params = useParams();
  const router = useRouter();
  const pathname = usePathname();

  const group_id = params.id as string;

  const fetchLocations = async (): Promise<Location[]> => {
    const res = await fetch("/api/locations");
    if (!res.ok) throw new Error("Failed to fetch locations");
    return res.json();
  };

  const postOrder = async (payload: orderPayload) => {
    const formData = new FormData();

    formData.append("name", payload.name);
    if (payload.email) formData.append("email", payload.email);
    formData.append("requestType", payload.requestType);
    formData.append("accountNumber", payload.accountNumber);
    formData.append("pickup_location", payload.pickup_location);
    formData.append("user_id", payload.user_id);

    if (payload.image) {
      const response = await fetch(payload.image);
      const blob = await response.blob();
      const file = new File([blob], "design.jpg", { type: blob.type });
      formData.append("image", file);
    }

    if (payload.list_of_phoneNumbers?.length) {
      payload.list_of_phoneNumbers.forEach((phone, index) => {
        formData.append(`list_of_phoneNumbers[${index}]`, phone);
      });
    }

    const res = await fetch("/api/order", {
      method: "POST",
      headers: {
        "X-Session-Token": payload.session_token,
      },
      body: formData,
    });

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.message || "Failed to submit order");
    }

    return res.json();
  };

  const confirmInvitationOrder = async (payload: SendOrderData) => {
    const res = await fetch("/api/invitation-confirm", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.message || "Failed to confirm invitation");
    }

    return res.json();
  };

  const postSendOtp = async (phoneNumber: string) => {
    const res = await fetch("/api/send-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phoneNumber }),
    });

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.message || "Failed to send OTP");
    }

    return res.json(); // { id, message }
  };

  const postVerifyOtp = async (id: string, otp: string) => {
    const res = await fetch("/api/verify-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, otp }),
    });

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.message || "Failed to verify OTP");
    }

    return res.json(); // { id, accounts, session_token }
  };

  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendTimer]);

  const handleResendOtp = () => {
    send_otp.mutate({ phoneNumber: formik.values.phone });
  };

  const send_otp = useMutation({
    mutationFn: ({ phoneNumber }: { phoneNumber: string }) =>
      postSendOtp(phoneNumber),
    onMutate: () => {
      setResendTimer(120);
      setError("");
    },
    onSuccess: (data: { id: string; message: string }) => {
      setId(data.id);
      setModalVisible(true);
    },
    onError: (err) => {
      setOtpSendError(err.message);
    },
  });

  const verify_otp = useMutation({
    mutationFn: (code: string) => postVerifyOtp(id, code),
    onSuccess: (data) => {
      setAccounts(data.accounts);
      setSessionToken(data.session_token);
      setIsOtpVerified(true);
      setModalVisible(false);
    },
    onError: (error: any) => {
      setError(error.message);
    },
  });

  const sendOrder = useMutation({
    mutationFn: (data: orderPayload) => postOrder(data),
    onSuccess: () => {
      setIsSubmitted(true);
    },
    onSettled: () => {
      setIsSubmitting(false);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to submit order. Please try again.",
        variant: "destructive",
      });
    },
  });

  const confirmOrder = useMutation({
    mutationFn: (data: SendOrderData) => confirmInvitationOrder(data),
    onSuccess: () => {
      setIsSubmitted(true);
    },
    onSettled: () => {
      setIsSubmitting(false);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to accept invitation. Please try again.",
        variant: "destructive",
      });
    },
  });

  const locations = useQuery({
    queryKey: ["location"],
    queryFn: () => fetchLocations(),
  });

  const formik = useFormik({
    initialValues: {
      fullName: "",
      email: "",
      phone: "",
      agreeToTerms: false,
      orderType: "Individual",
      groupPhones: [""],
      account: "",
      pickup_location: "", // replace with actual location if available
    },
    validationSchema,
    onSubmit: async (values) => {
      // console.log(values);
      setIsSubmitting(true);
      if (!isOtpVerified) {
        toast({
          title: "Error",
          description: "Please verify your phone number",
          variant: "destructive",
        });
        setIsSubmitting(false);
        return;
      }

      if (group_id) {
        const sendOrderData: SendOrderData = {
          name: values.fullName,
          email: values.email,
          accountNumber: values.account,
          pickup_location: values.pickup_location, // replace with actual location if available
          user_id: id,
          group_id: group_id,
          session_token: sessionToken,
        };
        confirmOrder.mutate(sendOrderData);
      } else {
        const sendOrderData: orderPayload = {
          email: values.email,
          name: values.fullName,
          accountNumber: values.account,
          pickup_location: values.pickup_location, // replace with actual location if available
          requestType: values.orderType,
          image: await triggerScreenshot(),
          list_of_phoneNumbers: values.groupPhones.filter((phone) => phone),
          user_id: id,
          session_token: sessionToken,
        };
        sendOrder.mutate(sendOrderData);
      }
    },
  });

  useEffect(() => {
    setIsOtpVerified(false);
  }, [formik.values.phone]);

  const handleOtpCall = (otp: string) => {
    verify_otp.mutate(otp);
  };

  if (isSubmitted) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-10">
            <CheckCircle2 className="mx-auto h-16 w-16 text-green-500 mb-4" />
            <h2 className="text-2xl font-bold mb-2">
              Order Submitted Successfully!
            </h2>
            <p className="text-gray-600 mb-6 leading-relaxed">
              Thank you for your order. Your custom debit card will be processed
              and delivered within 7-10 business days.
            </p>
            <p className="text-gray-600 mb-6">
              A confirmation email has been sent to {formik.values.email}.
            </p>
            <Button
              onClick={() => {
                if (pathname === "/cards/new") {
                  window.location.reload();
                } else {
                  router.replace("/cards/new");
                }
              }}
            >
              Design Another Card
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (sendOrder.isPending || isSubmitting) {
    return <LoadingScreen message="Submitting Order ..." />;
  }

  if (confirmOrder.isPending || isSubmitting) {
    return <LoadingScreen message="Accepting Invitation ..." />;
  }

  if (send_otp.isPending) {
    return <LoadingScreen message="Sending OTP ..." />;
  }

  if (verify_otp.isPending) {
    return <LoadingScreen message="Verifying OTP ..." />;
  }

  if (locations.isLoading) {
    return <LoadingScreen message="Fetching Locations ..." />;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center">
          <Button
            variant="ghost"
            size="icon"
            onClick={onBackToDesign}
            className="mr-2"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <CardTitle>Complete Your Order</CardTitle>
            <CardDescription>
              Please provide your details to complete your custom card order.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={formik.handleSubmit} className="space-y-4">
          {Object.keys(design).length === 0 && (
            <div className="space-y-2">
              <Label>Order Type</Label>
              <RadioGroup
                className="bg-gray-100 p-2 rounded-md"
                value={formik.values.orderType}
                onValueChange={(value) => {
                  formik.setFieldValue("orderType", value);
                  formik.setFieldValue("groupPhones", [""]);
                }}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="Individual" id="individual" />
                  <Label className=" px-2 rounded-md" htmlFor="individual">
                    Individual
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="Group" id="group" />
                  <Label className=" px-2 rounded-md" htmlFor="group">
                    Group
                  </Label>
                </div>
              </RadioGroup>
              {formik.touched.orderType && formik.errors.orderType ? (
                <div className="text-red-500 text-sm">
                  {formik.errors.orderType}
                </div>
              ) : null}
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name</Label>
              <Input
                id="fullName"
                name="fullName"
                value={formik.values.fullName}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                required
              />
              {formik.touched.fullName && formik.errors.fullName ? (
                <div className="text-red-500 text-sm">
                  {formik.errors.fullName}
                </div>
              ) : null}
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formik.values.email}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                required
              />
              {formik.touched.email && formik.errors.email ? (
                <div className="text-red-500 text-sm">
                  {formik.errors.email}
                </div>
              ) : null}
            </div>
          </div>

          <div className="space-y-2 flex flex-col">
            <Label htmlFor="phone">My Phone Number</Label>
            <Input
              id="phone"
              name="phone"
              type="tel"
              value={formik.values.phone}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              required
            />
            {formik.touched.phone && formik.errors.phone ? (
              <div className="text-red-500 text-sm">{formik.errors.phone}</div>
            ) : null}
            {formik.touched.phone && !formik.errors.phone && !isOtpVerified && (
              <div className="text-red-500 text-sm">
                Phone number needs to be verified
              </div>
            )}
            {formik.values.phone && !formik.errors.phone && !isOtpVerified && (
              <Button
                className="self-end"
                type="button"
                onClick={() =>
                  send_otp.mutate({ phoneNumber: formik.values.phone })
                }
              >
                Verify
              </Button>
            )}
          </div>

          {isOtpVerified && (
            <div className="space-y-2">
              <Label htmlFor="account">Select Account Number</Label>
              <select
                id="account"
                name="account"
                value={formik.values.account}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                required
                className="w-full p-2 border rounded-md"
              >
                <option value="" disabled>
                  Select an account
                </option>
                {accounts?.map(
                  (account: { id: string; accountNumber: string }) => (
                    <option key={account.id} value={account.accountNumber}>
                      {account.accountNumber}
                    </option>
                  )
                )}
              </select>
              {formik.touched.account && formik.errors.account ? (
                <div className="text-red-500 text-sm">
                  {formik.errors.account}
                </div>
              ) : null}
            </div>
          )}

          {formik.values.orderType === "Group" && (
            <div className="flex flex-col space-y-2">
              <Label>Invite Users by Phone Numbers</Label>
              {formik.values.groupPhones.map((phone, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <Input
                    name={`groupPhones[${index}]`}
                    value={phone}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    required
                    pattern="^(\+251|0)?9\d{8}$"
                    title="Phone number is not valid"
                  />

                  {formik.values.groupPhones.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        const newGroupPhones = formik.values.groupPhones.filter(
                          (_, i) => i !== index
                        );
                        formik.setFieldValue("groupPhones", newGroupPhones);
                      }}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={1.5}
                        stroke="currentColor"
                        className="w-5 h-5"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </Button>
                  )}
                </div>
              ))}
              {formik.touched.groupPhones && formik.errors.groupPhones ? (
                <div className="text-red-500 text-sm">
                  {formik.errors.groupPhones}
                </div>
              ) : null}
              <Button
                className="self-end"
                type="button"
                onClick={() => {
                  formik.setFieldValue("groupPhones", [
                    ...formik.values.groupPhones,
                    "",
                  ]);
                }}
              >
                Add
              </Button>
            </div>
          )}

          <div className="space-y-2">
            <Label>Pickup Branch</Label>
            <div className="w-full bg-gray-200 rounded-md">
              {formik.touched.pickup_location &&
              formik.errors.pickup_location ? (
                <div className="text-red-500 text-sm">
                  {formik.errors.pickup_location}
                </div>
              ) : null}
              <MapComponent
                setPickup={(location: string) =>
                  formik.setFieldValue("pickup_location", location)
                }
                location={locations.data || []}
              />
            </div>
          </div>

          <div className="flex items-center space-x-2 pt-4">
            <Checkbox
              id="agreeToTerms"
              name="agreeToTerms"
              checked={formik.values.agreeToTerms}
              onCheckedChange={(checked) =>
                formik.setFieldValue("agreeToTerms", checked as boolean)
              }
              required
            />
            <Label htmlFor="agreeToTerms" className="text-sm">
              I agree to the terms and conditions and understand that my card
              design will be reviewed before production.
            </Label>
            {formik.touched.agreeToTerms && formik.errors.agreeToTerms ? (
              <div className="text-red-500 text-sm">
                {formik.errors.agreeToTerms}
              </div>
            ) : null}
          </div>

          <div className="pt-4">
            <Button
              type="submit"
              className="w-full"
              disabled={!formik.values.agreeToTerms}
            >
              Submit Order
            </Button>
          </div>
        </form>
      </CardContent>

      <Dialog open={isModalVisible} onOpenChange={setModalVisible}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Enter Verification Code</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center space-y-4">
            <p className="text-sm text-muted-foreground text-center">
              Please enter the verification code sent to your phone
            </p>
            <InputOTP
              maxLength={6}
              onComplete={handleOtpCall}
              className="gap-2"
            >
              <InputOTPGroup>
                <InputOTPSlot index={0} />
                <InputOTPSlot index={1} />
                <InputOTPSlot index={2} />
                <InputOTPSlot index={3} />
                <InputOTPSlot index={4} />
                <InputOTPSlot index={5} />
              </InputOTPGroup>
            </InputOTP>
            {error && (
              <p className="text-sm text-red-500 text-center">{error}</p>
            )}
            <p className="text-sm text-muted-foreground">
              Didn&apos;t receive a code?{" "}
              {resendTimer > 0 ? (
                <span>Resend in {resendTimer}s</span>
              ) : (
                <Button
                  variant="link"
                  className="p-0 h-auto"
                  onClick={handleResendOtp}
                >
                  Resend
                </Button>
              )}
            </p>
          </div>
        </DialogContent>
      </Dialog>

      {otpSendError && (
        <Dialog open={!!otpSendError} onOpenChange={() => setOtpSendError("")}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Error</DialogTitle>
            </DialogHeader>
            <div className="flex flex-col items-center space-y-4">
              <p className="text-sm text-red-500 text-center">{otpSendError}</p>
              <Button onClick={() => setOtpSendError("")}>Close</Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </Card>
  );
}
