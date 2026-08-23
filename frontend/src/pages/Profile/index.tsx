import { Avatar, Box, Button, Divider, Paper } from "@mui/material";
import PhotoCameraIcon from "@mui/icons-material/PhotoCamera";
import { useDispatch, useSelector } from "react-redux";
import { AppState } from "../../store";
import { useMutation } from "react-query";
import { useEffect, useRef } from "react";
import { FileApi } from "../../api/file";
import { useFormik } from "formik";
import profileForm from "../../forms/profileForm";
import { UserApi } from "../../api/userApi";
import TextInput from "../../components/TextInput";
import PageHeader from "../../components/PageHeader";
import { LoadingButton } from "@mui/lab";
import { showSuccess } from "../../utils/showSuccess";
import { useNavigate } from "react-router-dom";
import {
  updateProfile,
  updateProfileImage,
} from "../../store/actions/userAction";

function Profile() {
  const navigate = useNavigate();
  const { data: user } = useSelector((state: AppState) => state.user);
  const dispatch = useDispatch<any>();
  const fileRef = useRef<HTMLInputElement>(null);

  const form = useFormik({
    initialValues: profileForm.initialValues,
    validationSchema: profileForm.validationSchema,
    onSubmit: (values) => {
      updateMutation.mutate(values);
    },
  });

  useEffect(() => {
    form.setFieldValue("email", user.email);
    form.setFieldValue("lastName", user.lastName);
    form.setFieldValue("firstName", user.firstName);
    form.setFieldValue("profileImageURL", user.profileImageURL ?? "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user.email, user.firstName, user.lastName, user.profileImageURL]);

  const handleFileChange = async (e: any) => {
    if (!e.target.files) {
      return;
    }
    const fileData = new FormData();
    fileData.append("file", e.target.files[0]);
    const res = await FileApi.saveFile(fileData);
    form.setFieldValue("profileImageURL", res);
    dispatch(updateProfileImage({ profileImageURL: res }));
  };

  const updateMutation = useMutation(UserApi.updateUser, {
    onSuccess: (res) => {
      dispatch(updateProfile(res, form.values));
      showSuccess("Your profile has been updated successfully");
      navigate(`/`);
    },
  });

  return (
    <div className="page-shell">
      <PageHeader
        title="Profile"
        subtitle="Update your personal information and profile picture."
      />
      <Paper className="mx-auto max-w-xl p-6 sm:p-10">
        <form onSubmit={form.handleSubmit} className="space-y-6">
          <Box className="flex flex-col items-center gap-4">
            <Box className="relative">
              <Avatar
                alt={(user.firstName ?? "") + (user.lastName ?? "")}
                src={user.profileImageURL ?? ""}
                className="!h-32 !w-32 !bg-brand-soft !text-4xl !font-bold !text-brand"
              >
                {(user.firstName?.at(0)?.toUpperCase() ?? "") +
                  (user.lastName?.at(0)?.toUpperCase() ?? "")}
              </Avatar>
              <Button
                size="small"
                className="absolute -bottom-2 left-1/2 !min-w-0 -translate-x-1/2 !rounded-full !bg-action !p-2 !text-oncontrast hover:!bg-action-hover"
                onClick={() => fileRef.current?.click()}
                aria-label="Upload profile picture"
              >
                <PhotoCameraIcon fontSize="small" />
              </Button>
            </Box>
            <input
              type="file"
              hidden
              onChange={handleFileChange}
              accept="image/*"
              ref={fileRef}
            />
          </Box>

          <Divider />

          <TextInput name="email" label="Email" form={form} disabled />
          <TextInput name="firstName" label="First Name" form={form} />
          <TextInput name="lastName" label="Last Name" form={form} />

          <LoadingButton
            variant="contained"
            fullWidth
            size="large"
            type="submit"
            loading={updateMutation.isLoading}
          >
            Save changes
          </LoadingButton>
        </form>
      </Paper>
    </div>
  );
}

export default Profile;
