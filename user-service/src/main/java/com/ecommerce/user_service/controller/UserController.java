package com.ecommerce.user_service.controller;

import static com.ecommerce.user_service.constant.FileConstant.*;
import static com.ecommerce.user_service.constant.RequestConstant.*;

import com.ecommerce.user_service.audit.AuditLogService;
import com.ecommerce.user_service.dto.*;
import com.ecommerce.user_service.exception.HttpResponse;
import com.ecommerce.user_service.model.User;
import com.ecommerce.user_service.model.UserPrincipal;
import com.ecommerce.user_service.service.PasswordResetService;
import com.ecommerce.user_service.dto.PhoneOtpSentResponse;
import com.ecommerce.user_service.service.PhoneOtpService;
import com.ecommerce.user_service.service.EmailMfaService;
import com.ecommerce.user_service.dto.MfaVerifyRequest;
import com.ecommerce.user_service.dto.MfaToggleRequest;
import com.ecommerce.user_service.dto.PhoneOtpRequest;
import com.ecommerce.user_service.dto.PhoneOtpVerifyRequest;
import com.ecommerce.user_service.dto.PhoneRegisterRequest;
import com.ecommerce.user_service.service.UserService;
import com.ecommerce.user_service.util.AuthenticationHelper;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;


import javax.validation.Valid;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.net.URL;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.util.UUID;

import static com.ecommerce.user_service.constant.SecurityConstant.AUTHORITIES;
import static com.ecommerce.user_service.constant.SecurityConstant.TOKEN_PREFIX;
import static org.springframework.http.HttpHeaders.AUTHORIZATION;
import static org.springframework.http.HttpStatus.OK;
import static org.springframework.http.MediaType.IMAGE_JPEG_VALUE;

@RestController
@RequestMapping("/user")
@RequiredArgsConstructor
public class UserController {
    private final UserService userService;
    private final AuthenticationHelper authenticationHelper;
    private final AuditLogService auditLogService;
    private final PasswordResetService passwordResetService;
    private final PhoneOtpService phoneOtpService;
    private final EmailMfaService emailMfaService;
    @PostMapping("/register")
    public ResponseEntity<String> register(@RequestBody RegisterUserRequest user)  {
        userService.register(user);
        return ResponseEntity.ok(REGISTER_RES);
    }

    /** Phone sign-in step 1: text a one-time code to the phone. */
    @PostMapping("/otp/request")
    public ResponseEntity<PhoneOtpSentResponse> requestPhoneOtp(
            @Valid @RequestBody PhoneOtpRequest request) {
        return ResponseEntity.ok(phoneOtpService.request(request.getPhone()));
    }

    /** Phone sign-in step 2: exchange the code for the standard token pair. */
    @PostMapping("/otp/verify")
    public ResponseEntity<LoginResponse> verifyPhoneOtp(
            @Valid @RequestBody PhoneOtpVerifyRequest request) {
        return ResponseEntity.ok(phoneOtpService.verify(request.getPhone(), request.getCode()));
    }

    /** Phone sign-up: complete account creation for a verified number. */
    @PostMapping("/phone/register")
    public ResponseEntity<LoginResponse> registerPhone(
            @Valid @RequestBody PhoneRegisterRequest request) {
        return ResponseEntity.ok(phoneOtpService.completeSignUp(request));
    }

    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(@RequestBody LoginUserRequest user) {
        authenticationHelper.authenticate(user.getEmail(), user.getPassword());
        User loginUser = userService.findUserByEmail(user.getEmail());
        // Step-up: MFA accounts get an e-mailed code instead of tokens.
        // The password check above has already happened — identity proven.
        if (loginUser.isMfaEnabled()) {
            String devCode = emailMfaService.issueCode(loginUser.getEmail());
            LoginResponse challenge = new LoginResponse(null, null, "MFA_REQUIRED", null);
            challenge.setDevCode(devCode);
            return ResponseEntity.ok(challenge);
        }
        UserPrincipal userPrincipal = new UserPrincipal(loginUser);
        LoginResponse loginResponse = authenticationHelper.getLoginResponse(userPrincipal);
        return ResponseEntity.ok(loginResponse);
    }

    /** Step 2 of MFA sign-in: exchange the e-mailed code for tokens. */
    @PostMapping("/mfa/verify")
    public ResponseEntity<LoginResponse> verifyMfa(@Valid @RequestBody MfaVerifyRequest request) {
        return ResponseEntity.ok(emailMfaService.verify(request.getEmail(), request.getCode()));
    }

    /** Enable/disable two-step verification for the signed-in account. */
    @PostMapping("/mfa")
    public ResponseEntity<java.util.Map<String, Object>> toggleMfa(@Valid @RequestBody MfaToggleRequest request) {
        java.util.UUID userId = java.util.UUID.fromString(
                org.springframework.security.core.context.SecurityContextHolder.getContext()
                        .getAuthentication().getPrincipal().toString());
        boolean enabled = emailMfaService.setMfaEnabled(userId, request.getEnabled());
        return ResponseEntity.ok(java.util.Map.of("mfaEnabled", enabled));
    }

    @GetMapping("/token/refresh")
    public ResponseEntity<RefreshTokenResponse> refreshToken(HttpServletRequest request, HttpServletResponse response)
            throws IOException {
        String authorizationHeader = request.getHeader("refresh-token");
        return ResponseEntity.ok(authenticationHelper.validateRefreshToken(authorizationHeader,response));
    }

    @PostMapping("/validateToken")
    public ResponseEntity<UserDto> validateToken(@RequestHeader(AUTHORIZATION) String authorizationHeader) {
        String token = authorizationHeader.substring(TOKEN_PREFIX.length());
        return ResponseEntity.ok(userService.validateToken(token));
    }

    @GetMapping("/me")
    public ResponseEntity<MeDto> getMe(@RequestHeader(AUTHORIZATION) String authorizationHeader) {
        String token = authorizationHeader.substring(TOKEN_PREFIX.length());
        return ResponseEntity.ok(userService.getMe(token));
    }

    @GetMapping("/getById/{userId}")
    @PreAuthorize("hasAnyAuthority('ROLE_MANAGER','ROLE_ADMIN','ROLE_SUPER_ADMIN')")
    public ResponseEntity<UserCredential> getUserById(@PathVariable UUID userId) {
        return ResponseEntity.ok(userService.getUserCredentialsById(userId));
    }

    @GetMapping("/all")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN','ROLE_SUPER_ADMIN')")
    public ResponseEntity<java.util.List<AdminUserDto>> getAllUsers() {
        return ResponseEntity.ok(userService.getAllUsers());
    }

    @PutMapping("/disable/{userId}")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN','ROLE_SUPER_ADMIN')")
    public ResponseEntity<HttpResponse> disableUser(@PathVariable UUID userId) {
        userService.setUserActive(userId, false);
        auditLogService.record("USER_DISABLED", "USER", userId.toString(), null);
        return new ResponseEntity<>(new HttpResponse(OK.value(), OK, OK.getReasonPhrase().toUpperCase(),
                DISABLE_USER_RES), OK);
    }

    @PutMapping("/enable/{userId}")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN','ROLE_SUPER_ADMIN')")
    public ResponseEntity<HttpResponse> enableUser(@PathVariable UUID userId) {
        userService.setUserActive(userId, true);
        auditLogService.record("USER_ENABLED", "USER", userId.toString(), null);
        return new ResponseEntity<>(new HttpResponse(OK.value(), OK, OK.getReasonPhrase().toUpperCase(),
                ENABLE_USER_RES), OK);
    }

    @PostMapping("/add")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN','ROLE_SUPER_ADMIN')")
    public ResponseEntity<String> addUser(@RequestBody AddUserRequest user)  {
        userService.addNewUser(user);
        return ResponseEntity.ok(ADD_USER_RES);
    }

    @PutMapping("/role/{userId}")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN','ROLE_SUPER_ADMIN')")
    public ResponseEntity<AdminUserDto> updateStaffRole(@PathVariable UUID userId,
                                                         @RequestParam String role) {
        AdminUserDto updated = userService.setStaffRole(userId, role);
        auditLogService.record("USER_ROLE_UPDATED", "USER", userId.toString(), role);
        return ResponseEntity.ok(updated);
    }

    @PutMapping("/update")
    public ResponseEntity<LoginResponse> updateUser(@Valid @RequestBody UpdateUserRequest user,
                                                     @RequestHeader(AUTHORIZATION) String authorizationHeader)  {
        String token = authorizationHeader.substring(TOKEN_PREFIX.length());
        User currentUser = userService.updateUser(user, token);
        UserPrincipal userPrincipal = new UserPrincipal(currentUser);
        LoginResponse loginResponse = authenticationHelper.getLoginResponse(userPrincipal);
        return ResponseEntity.ok(loginResponse);
    }

    @PutMapping("/updatePassword")
    public ResponseEntity<LoginResponse> updatePassword(@RequestBody UpdatePasswordRequest user ,
                                                        @RequestHeader(AUTHORIZATION) String authorizationHeader)  {
        String token = authorizationHeader.substring(TOKEN_PREFIX.length());
        User currentUser = userService.updatePassword(user,token);
        UserPrincipal userPrincipal = new UserPrincipal(currentUser);
        LoginResponse loginResponse = authenticationHelper.getLoginResponse(userPrincipal);
        return ResponseEntity.ok(loginResponse);
    }

    @GetMapping("/find/{email}")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN','ROLE_SUPER_ADMIN')")
    public ResponseEntity<User> getUser(@PathVariable String email) {
        return ResponseEntity.ok(userService.findUserByEmail(email));
    }

    @PostMapping("/password-reset/request")
    public ResponseEntity<HttpResponse> requestPasswordReset(@Valid @RequestBody PasswordResetRequest request) {
        passwordResetService.request(request.getEmail());
        return new ResponseEntity<>(new HttpResponse(OK.value(), OK, OK.getReasonPhrase().toUpperCase(),
                "If an account exists, password reset instructions have been sent."), OK);
    }

    @PostMapping("/password-reset/confirm")
    public ResponseEntity<HttpResponse> confirmPasswordReset(@Valid @RequestBody PasswordResetConfirmRequest request) {
        passwordResetService.confirm(request.getToken(), request.getNewPassword());
        return new ResponseEntity<>(new HttpResponse(OK.value(), OK, OK.getReasonPhrase().toUpperCase(),
                "Password updated. You can now sign in."), OK);
    }

    @DeleteMapping("/delete/{email}")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN','ROLE_SUPER_ADMIN')")
    public ResponseEntity<HttpResponse> deleteUser(@PathVariable String email){
        userService.deleteUser(email);
        return new ResponseEntity<>(new HttpResponse(OK.value(), OK, OK.getReasonPhrase().toUpperCase(),
                DELETE_USER_RES), OK);
    }

    @PostMapping("/updateProfileImage")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN','ROLE_SUPER_ADMIN')")
    public ResponseEntity<User> updateProfileImage(@RequestParam String email,
                                                   @RequestParam MultipartFile profileImage) {
        return ResponseEntity.ok(userService.updateProfileImage(email,profileImage));
    }

    @GetMapping(path = "/image/{email}/{fileName}", produces = IMAGE_JPEG_VALUE)
    public byte[] getProfileImage(@PathVariable String email, @PathVariable String fileName) throws IOException {
        return Files.readAllBytes(Paths.get(USER_FOLDER + email + FORWARD_SLASH + fileName));
    }

    @GetMapping(path = "/image/profile/{email}", produces = IMAGE_JPEG_VALUE)
    public byte[] getTempProfileImage(@PathVariable String email) throws IOException {
        URL url = new URL(TEMP_PROFILE_IMAGE_BASE_URL + email);
        ByteArrayOutputStream byteArrayOutputStream = new ByteArrayOutputStream();
        try (InputStream inputStream = url.openStream()) {
            int bytesRead;
            byte[] chunk = new byte[1024];
            while((bytesRead = inputStream.read(chunk)) > 0) {
                byteArrayOutputStream.write(chunk, 0, bytesRead);
            }
        }
        return byteArrayOutputStream.toByteArray();
    }

    @GetMapping("/referral/code")
    public ResponseEntity<String> getMyReferralCode(@RequestHeader(AUTHORIZATION) String authorizationHeader) {
        String token = authorizationHeader.substring(TOKEN_PREFIX.length());
        User user = userService.getUserByToken(token);
        return ResponseEntity.ok(user.getReferralCode());
    }

    @GetMapping("/referral/validate/{code}")
    public ResponseEntity<Boolean> validateReferralCode(@PathVariable String code) {
        boolean valid = userService.findUserByReferralCode(code) != null;
        return ResponseEntity.ok(valid);
    }

}