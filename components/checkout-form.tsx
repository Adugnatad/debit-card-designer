"use client";

import { useActionState, useEffect, useState } from "react";
import { submitCheckout } from "@/app/cards/checkout/actions";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { validationSchema } from "@/schema/order-schema";
import { useFormik } from "formik";
import { RadioGroup, RadioGroupItem } from "./ui/radio-group";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import MapComponent from "./map-component";
import { Checkbox } from "./ui/checkbox";
import { useMutation, useQuery } from "@tanstack/react-query";
import type { Location } from "@/lib/apis/map_apis";
import { useParams, usePathname, useRouter } from "next/navigation";
import { orderPayload, SendOrderData } from "@/lib/apis/order_api";
import {
  confirmInvitationOrder,
  postOrder,
  postSendOtp,
  postVerifyOtp,
} from "@/hooks/use-confirmInvitationOrder";
import { LoadingScreen } from "./loading-screen";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "./ui/input-otp";

export default function CheckoutForm() {
  const router = useRouter();
  const params = useParams();
  const pathname = usePathname();
  const group_id = params.id as string;
  const { toast } = useToast();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isModalVisible, setModalVisible] = useState(false);
  const [error, setError] = useState("");
  const [isOtpVerified, setIsOtpVerified] = useState(true);
  const [id, setId] = useState("");
  const [sessionToken, setSessionToken] = useState("");
  const [accounts, setAccounts] = useState<
    { id: string; accountNumber: string }[]
  >([]);
  const [otpSendError, setOtpSendError] = useState("");
  const [resendTimer, setResendTimer] = useState(120);

  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendTimer]);

  const handleResendOtp = () => {
    send_otp.mutate({ phoneNumber: formik.values.phone });
  };

  const fetchLocations = async (): Promise<Location[]> => {
    const res = await fetch("/api/locations");
    if (!res.ok) throw new Error("Failed to fetch locations");
    const data = await res.json();
    // Ensure each location has name, lat, lng
    return data.map((loc: any) => ({
      name: loc.name,
      lat: loc.lat,
      lng: loc.lng,
      ...loc,
    })) as Location[];
  };

  const locations = useQuery({
    queryKey: ["location"],
    queryFn: () => fetchLocations(),
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
      console.log("values are:", values);
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
          image: "",
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
            onClick={() => router.back()}
            // onClick={onBackToDesign}
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
        <form className="space-y-4" onSubmit={formik.handleSubmit}>
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
            <div className="flex justify-between">
              <Label htmlFor="phone">My Phone Number</Label>
              <a href="#">Don't have account number?</a>
            </div>
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
