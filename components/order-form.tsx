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
import {
  confirmInvitation,
  orderPayload,
  SendOrderData,
  submitOrder,
} from "@/lib/apis/order_api";
import { useToast } from "@/hooks/use-toast";
import { LoadingScreen } from "./loading-screen";
import { sendOtp, verifyOtp } from "@/lib/apis/otp_api";
import { useParams } from "next/navigation";
import { group } from "node:console";
import MapComponent from "./map-component";
import { getLocation } from "@/lib/apis/map_apis";

interface OrderFormProps {
  design: any;
  onBackToDesign: () => void;
  cardDesign: CardDesign;
  triggerScreenshot: () => Promise<string>;
}

const validationSchema = Yup.object({
  fullName: Yup.string().required("Full Name is required"),
  email: Yup.string()
    .email("Invalid email address")
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
  const [accounts, setAccounts] = useState<
    { id: string; accountNumber: string }[]
  >([]);
  const { toast } = useToast();
  const [otpSendError, setOtpSendError] = useState("");
  const [resendTimer, setResendTimer] = useState(60);
  const params = useParams();

  const group_id = params.id as string;

  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendTimer]);

  const handleResendOtp = () => {
    setResendTimer(60);
    send_otp.mutate({ phoneNumber: formik.values.phone });
  };

  const send_otp = useMutation({
    mutationFn: ({ phoneNumber }: { phoneNumber: string }) =>
      sendOtp({ phoneNumber }),
    onSuccess: (data: { id: string; message: string }) => {
      setId(data.id);
      setModalVisible(true);
    },
    onError: (err) => {
      setOtpSendError("Failed to send OTP. Please try again.");
    },
  });

  const verify_otp = useMutation({
    mutationFn: (code: string) => verifyOtp({ id, otp: code }),
    onSuccess: (data) => {
      setAccounts(data);
      setIsOtpVerified(true);
      setModalVisible(false);
    },
    onError: (error: any) => {
      setError("Invalid OTP code");
    },
  });

  const sendOrder = useMutation({
    mutationFn: (data: orderPayload) => submitOrder(data),
    onSuccess: () => {
      setIsSubmitted(true);
    },
    onError: () => {},
  });

  const confirmOrder = useMutation({
    mutationFn: (data: SendOrderData) => confirmInvitation(data),
    onSuccess: () => {
      setIsSubmitted(true);
    },
    onError: () => {},
  });

  const locations = useQuery({
    queryKey: ["location"],
    queryFn: () => getLocation(),
  });

  const formik = useFormik({
    initialValues: {
      fullName: "",
      email: "",
      phone: "",
      agreeToTerms: false,
      orderType: "individual",
      groupPhones: [""],
      account: "",
    },
    validationSchema,
    onSubmit: async (values) => {
      console.log(values);
      setIsSubmitting(true);
      if (group_id) {
        const sendOrderData: SendOrderData = {
          name: values.fullName,
          email: values.email,
          accountNumber: values.account,
          pickup_location: "default_location", // replace with actual location if available
          user_id: id,
          group_id: group_id,
        };
        confirmOrder.mutate(sendOrderData);
      } else {
        const sendOrderData: orderPayload = {
          email: values.email,
          name: values.fullName,
          accountNumber: values.account,
          pickup_location: "default_location", // replace with actual location if available
          requestType: values.orderType,
          image: await triggerScreenshot(),
          list_of_phoneNumbers: values.groupPhones.filter((phone) => phone),
          user_id: group_id,
        };
        sendOrder.mutate(sendOrderData);

        // await triggerScreenshot().then((image) => {
        //   const sendOrderData: orderPayload = {
        //     image: image,
        //     email: values.email,
        //     name: values.fullName,
        //     accountNumber: values.account,
        //     list_of_phoneNumbers: values.groupPhones,
        //     pickup_location: "default_location", // replace with actual location if available
        //     requestType: values.orderType,
        //     user_id: id,
        //   }
        //   sendOrder.mutate(sendOrderData);
        // })
      }
    },
  });

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
            <p className="text-gray-600 mb-6">
              Thank you for your order. Your custom debit card will be processed
              and delivered within 7-10 business days.
            </p>
            <p className="text-gray-600 mb-6">
              A confirmation email has been sent to {formik.values.email}.
            </p>
            <Button onClick={() => window.location.reload()}>
              Design Another Card
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (sendOrder.isPending) {
    return <LoadingScreen message="Submitting Order ..." />;
  }

  if (confirmOrder.isPending) {
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
                onValueChange={(value) =>
                  formik.setFieldValue("orderType", value)
                }
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
                {accounts.map(
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
                  {formik.touched.groupPhones &&
                  formik.errors.groupPhones &&
                  formik.errors.groupPhones[index] ? (
                    <div className="text-red-500 text-sm">
                      {formik.errors.groupPhones[index]}
                    </div>
                  ) : null}
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
              <MapComponent location={locations.data || []} />
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
