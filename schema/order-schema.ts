import * as Yup from "yup";

export const validationSchema = Yup.object({
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
