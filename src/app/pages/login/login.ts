import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.html',
  styleUrls: ['./login.scss']
})
export class Login {
  username: string = '';
  otp: string = '';
  otpSent: boolean = false;
  isLoading: boolean = false;
  errorMessage: string = '';
  successMessage: string = '';

  private apiUrl = 'https://dealradar-api.runasp.net/api/auth';

  constructor(private http: HttpClient, private router: Router) {}

  sendOtp() {
    if (!this.username) {
      this.errorMessage = 'Please enter your Bot Username.';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.http.post<any>(`${this.apiUrl}/send-otp`, { username: this.username })
      .subscribe({
        next: (res) => {
          this.isLoading = false;
          this.otpSent = true;
          this.successMessage = res?.message || 'OTP sent to your Telegram bot!';
        },
        error: (err) => {
          this.isLoading = false;
          this.errorMessage = err.error?.message || 'Failed to send OTP. Please try again.';
        }
      });
  }

  verifyAndLogin() {
    if (!this.otp || this.otp.length !== 4) {
      this.errorMessage = 'Please enter the 4-digit OTP received on Telegram.';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    this.http.post<any>(`${this.apiUrl}/verify-otp`, { username: this.username, otp: this.otp })
      .subscribe({
        next: (res) => {
          this.isLoading = false;
          localStorage.setItem('dealradar_token', res.token);
          this.router.navigate(['/dashboard']);
        },
        error: (err) => {
          this.isLoading = false;
          this.errorMessage = err.error?.message || 'Invalid OTP.';
        }
      });
  }
}
