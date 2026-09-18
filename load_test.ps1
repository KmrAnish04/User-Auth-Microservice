# ============================================
# PowerShell Load Testing Script
# For Windows without k6 installation
# ============================================

param(
    [string]$BaseUrl = "http://52.4.118.129:3000",
    [string]$TestType = "smoke",
    [int]$DurationSeconds = 60,
    [int]$Concurrency = 10
)

# Colors for output
function Write-Success { Write-Host $args -ForegroundColor Green }
function Write-Info { Write-Host $args -ForegroundColor Cyan }
function Write-Warning { Write-Host $args -ForegroundColor Yellow }
function Write-Error { Write-Host $args -ForegroundColor Red }

Write-Info "==================================="
Write-Info "SSO Auth Load Test - $TestType"
Write-Info "==================================="
Write-Info "Base URL: $BaseUrl"
Write-Info "Duration: $DurationSeconds seconds"
Write-Info "Concurrency: $Concurrency"
Write-Info ""

# Statistics
$script:totalRequests = 0
$script:successfulRequests = 0
$script:failedRequests = 0
$script:responseTimes = @()
$script:startTime = Get-Date

# Test function
function Test-Endpoint {
    param([string]$Url, [string]$Name)
    
    try {
        $start = Get-Date
        $response = Invoke-WebRequest -Uri $Url -UseBasicParsing -TimeoutSec 10 -ErrorAction Stop
        $duration = ((Get-Date) - $start).TotalMilliseconds
        
        $script:totalRequests++
        $script:successfulRequests++
        $script:responseTimes += $duration
        
        return @{
            Success = $true
            StatusCode = $response.StatusCode
            Duration = $duration
        }
    }
    catch {
        $script:totalRequests++
        $script:failedRequests++
        
        return @{
            Success = $false
            Error = $_.Exception.Message
        }
    }
}

# Test scenarios
function Run-SmokeTest {
    Write-Info "Running SMOKE TEST (1 user, 1 minute)..."
    
    $endTime = (Get-Date).AddSeconds(60)
    while ((Get-Date) -lt $endTime) {
        Test-Endpoint "$BaseUrl/api/v1/health" "Health"
        Start-Sleep -Milliseconds 1000
    }
}

function Run-LoadTest {
    Write-Info "Running LOAD TEST ($Concurrency users, $DurationSeconds seconds)..."
    
    $jobs = @()
    $endTime = (Get-Date).AddSeconds($DurationSeconds)
    
    # Create concurrent jobs
    for ($i = 1; $i -le $Concurrency; $i++) {
        $job = Start-Job -ScriptBlock {
            param($url, $endTime)
            
            $results = @{
                Total = 0
                Success = 0
                Failed = 0
            }
            
            while ((Get-Date) -lt $endTime) {
                try {
                    $response = Invoke-WebRequest -Uri "$url/api/v1/health" -UseBasicParsing -TimeoutSec 5
                    $results.Total++
                    if ($response.StatusCode -eq 200) {
                        $results.Success++
                    } else {
                        $results.Failed++
                    }
                }
                catch {
                    $results.Total++
                    $results.Failed++
                }
                
                Start-Sleep -Milliseconds (Get-Random -Minimum 500 -Maximum 2000)
            }
            
            return $results
        } -ArgumentList $BaseUrl, $endTime
        
        $jobs += $job
        Write-Info "Started worker $i"
    }
    
    # Wait for all jobs
    Write-Info "Workers running... Press Ctrl+C to stop"
    $jobs | Wait-Job | Out-Null
    
    # Collect results
    foreach ($job in $jobs) {
        $result = Receive-Job -Job $job
        $script:totalRequests += $result.Total
        $script:successfulRequests += $result.Success
        $script:failedRequests += $result.Failed
    }
    
    # Cleanup
    $jobs | Remove-Job
}

function Run-StressTest {
    Write-Info "Running STRESS TEST (increasing load)..."
    
    $stages = @(
        @{ Users = 10; Duration = 30 },
        @{ Users = 20; Duration = 30 },
        @{ Users = 50; Duration = 30 },
        @{ Users = 100; Duration = 30 }
    )
    
    foreach ($stage in $stages) {
        Write-Warning "Stage: $($stage.Users) concurrent users for $($stage.Duration) seconds"
        
        $jobs = @()
        $endTime = (Get-Date).AddSeconds($stage.Duration)
        
        for ($i = 1; $i -le $stage.Users; $i++) {
            $job = Start-Job -ScriptBlock {
                param($url, $endTime)
                
                while ((Get-Date) -lt $endTime) {
                    try {
                        Invoke-WebRequest -Uri "$url/api/v1/health" -UseBasicParsing -TimeoutSec 5 | Out-Null
                    }
                    catch { }
                    
                    Start-Sleep -Milliseconds 100
                }
            } -ArgumentList $BaseUrl, $endTime
            
            $jobs += $job
        }
        
        $jobs | Wait-Job | Out-Null
        $jobs | Remove-Job
        
        $script:totalRequests += ($stage.Users * $stage.Duration * 10)
    }
}

function Run-SpikeTest {
    Write-Info "Running SPIKE TEST (sudden load surge)..."
    
    # Normal load (5 users for 30 seconds)
    Write-Info "Phase 1: Normal load (5 users)"
    Start-Sleep -Seconds 5
    
    # SPIKE! (100 users for 10 seconds)
    Write-Warning "Phase 2: SPIKE! (100 users)"
    
    $jobs = @()
    $endTime = (Get-Date).AddSeconds(10)
    
    for ($i = 1; $i -le 100; $i++) {
        $job = Start-Job -ScriptBlock {
            param($url, $endTime)
            
            while ((Get-Date) -lt $endTime) {
                try {
                    Invoke-WebRequest -Uri "$url/api/v1/health" -UseBasicParsing -TimeoutSec 5 | Out-Null
                    $script:totalRequests++
                }
                catch {
                    $script:failedRequests++
                }
            }
        } -ArgumentList $BaseUrl, $endTime
        
        $jobs += $job
    }
    
    $jobs | Wait-Job | Out-Null
    $jobs | Remove-Job
    
    Write-Info "Phase 3: Cooldown (5 users)"
    Start-Sleep -Seconds 5
}

# Run selected test
switch ($TestType.ToLower()) {
    "smoke" { Run-SmokeTest }
    "load" { Run-LoadTest }
    "stress" { Run-StressTest }
    "spike" { Run-SpikeTest }
    default {
        Write-Error "Unknown test type: $TestType"
        Write-Info "Valid types: smoke, load, stress, spike"
        exit 1
    }
}

# Calculate statistics
$duration = ((Get-Date) - $script:startTime).TotalSeconds
$requestRate = if ($duration -gt 0) { $script:totalRequests / $duration } else { 0 }
$successRate = if ($script:totalRequests -gt 0) { ($script:successfulRequests / $script:totalRequests) * 100 } else { 0 }

$avgResponseTime = if ($script:responseTimes.Count -gt 0) {
    ($script:responseTimes | Measure-Object -Average).Average
} else {
    0
}

# Print summary
Write-Info ""
Write-Info "==================================="
Write-Info "TEST SUMMARY"
Write-Info "==================================="
Write-Success "Total Requests:      $($script:totalRequests)"
Write-Success "Successful:          $($script:successfulRequests)"
Write-Error "Failed:              $($script:failedRequests)"
Write-Info "Duration:            $($duration.ToString('F2')) seconds"
Write-Info "Request Rate:        $($requestRate.ToString('F2')) req/s"
Write-Success "Success Rate:        $($successRate.ToString('F2'))%"

if ($script:responseTimes.Count -gt 0) {
    $sortedTimes = $script:responseTimes | Sort-Object
    $p50 = $sortedTimes[[Math]::Floor($sortedTimes.Count * 0.5)]
    $p95 = $sortedTimes[[Math]::Floor($sortedTimes.Count * 0.95)]
    $p99 = $sortedTimes[[Math]::Floor($sortedTimes.Count * 0.99)]
    
    Write-Info "Avg Response Time:   $($avgResponseTime.ToString('F2'))ms"
    Write-Info "P50 Response Time:   $($p50.ToString('F2'))ms"
    Write-Info "P95 Response Time:   $($p95.ToString('F2'))ms"
    Write-Info "P99 Response Time:   $($p99.ToString('F2'))ms"
}

Write-Info "==================================="
