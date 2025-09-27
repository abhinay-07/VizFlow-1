# Test data for upload
$testCsvData = @"
id,name,email,age,salary,department
1,John Doe,john.doe@email.com,28,50000,Engineering
2,Jane Smith,jane.smith@email.com,32,60000,Marketing
3,Bob Johnson,,35,70000,Sales
4,Alice Brown,alice.brown@email.com,abc,55000,HR
5,Charlie Wilson,charlie.wilson@email.com,29,,Engineering
"@

# Create test file
$testFile = "C:\MyProjects\BNP\VizFlow\backend\test-sample.csv"
$testCsvData | Out-File -FilePath $testFile -Encoding UTF8

Write-Host "✅ Created test file: $testFile"
Write-Host "📤 Uploading to VizFlow API..."

try {
    # Upload using Invoke-RestMethod with proper form data
    $uri = "http://localhost:5000/api/upload"
    
    # Read file as bytes
    $fileBytes = [System.IO.File]::ReadAllBytes($testFile)
    $fileContent = [System.Text.Encoding]::UTF8.GetString($fileBytes)
    
    # Create boundary
    $boundary = [System.Guid]::NewGuid().ToString()
    
    # Create form data
    $LF = "`r`n"
    $bodyLines = (
        "--$boundary",
        "Content-Disposition: form-data; name=`"file`"; filename=`"test-sample.csv`"",
        "Content-Type: text/csv",
        "",
        $fileContent,
        "--$boundary--",
        ""
    ) -join $LF
    
    # Make request
    $response = Invoke-RestMethod -Uri $uri -Method Post -Body $bodyLines -ContentType "multipart/form-data; boundary=$boundary"
    
    Write-Host "✅ Upload successful!"
    Write-Host "Response:"
    $response | ConvertTo-Json -Depth 5 | Write-Host
    
} catch {
    Write-Host "❌ Upload failed: $($_.Exception.Message)"
    if ($_.Exception.Response) {
        Write-Host "Status: $($_.Exception.Response.StatusCode)"
    }
}

# Clean up
Remove-Item $testFile -ErrorAction SilentlyContinue
Write-Host "🧹 Test file cleaned up"