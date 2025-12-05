package com.ebaytools.companion

import android.Manifest
import android.content.pm.PackageManager
import android.os.Bundle
import androidx.appcompat.app.AppCompatActivity
import androidx.core.app.ActivityCompat
import androidx.core.content.ContextCompat
import androidx.navigation.fragment.NavHostFragment
import androidx.navigation.ui.setupWithNavController
import com.ebaytools.companion.databinding.ActivityMainBinding
import com.google.android.material.bottomnavigation.BottomNavigationView

class MainActivity : AppCompatActivity() {
    
    private lateinit var binding: ActivityMainBinding
    
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        
        binding = ActivityMainBinding.inflate(layoutInflater)
        setContentView(binding.root)
        
        // Setup navigation
        val navHostFragment = supportFragmentManager
            .findFragmentById(R.id.nav_host_fragment) as NavHostFragment
        val navController = navHostFragment.navController
        
        binding.bottomNavigation.setupWithNavController(navController)
        
        // Request permissions
        requestPermissions()
    }
    
    private fun requestPermissions() {
        val permissions = arrayOf(
            Manifest.permission.CAMERA,
            Manifest.permission.WRITE_EXTERNAL_STORAGE,
            Manifest.permission.RECORD_AUDIO
        )
        
        val permissionsToRequest = permissions.filter {
            ContextCompat.checkSelfPermission(this, it) != PackageManager.PERMISSION_GRANTED
        }
        
        if (permissionsToRequest.isNotEmpty()) {
            ActivityCompat.requestPermissions(
                this,
                permissionsToRequest.toTypedArray(),
                PERMISSIONS_REQUEST_CODE
            )
        }
    }
    
    override fun onRequestPermissionsResult(
        requestCode: Int,
        permissions: Array<out String>,
        grantResults: IntArray
    ) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults)
        
        if (requestCode == PERMISSIONS_REQUEST_CODE) {
            // Handle permission results
            val deniedPermissions = permissions.filterIndexed { index, _ ->
                grantResults[index] != PackageManager.PERMISSION_GRANTED
            }
            
            if (deniedPermissions.isNotEmpty()) {
                // Show explanation for denied permissions
                showPermissionExplanation(deniedPermissions)
            }
        }
    }
    
    private fun showPermissionExplanation(deniedPermissions: List<String>) {
        // Show dialog explaining why permissions are needed
    }
    
    companion object {
        private const val PERMISSIONS_REQUEST_CODE = 100
    }
}

// Data Models
data class Item(
    val id: String = UUID.randomUUID().toString(),
    val title: String,
    val category: String? = null,
    val condition: String? = null,
    val notes: String? = null,
    val price: String? = null,
    val location: String? = null,
    val photos: List<String> = emptyList(),
    val createdDate: Long = System.currentTimeMillis(),
    val modifiedDate: Long = System.currentTimeMillis()
)

data class ExportManifest(
    val version: String = "1.0",
    val appVersion: String = BuildConfig.VERSION_NAME,
    val deviceInfo: DeviceInfo = DeviceInfo(),
    val createdDate: String,
    val exportId: String = "exp_${System.currentTimeMillis()}",
    val items: List<ExportItem>
)

data class DeviceInfo(
    val model: String = android.os.Build.MODEL,
    val androidVersion: String = android.os.Build.VERSION.RELEASE,
    val appVersion: String = BuildConfig.VERSION_NAME
)

data class ExportItem(
    val id: String,
    val title: String,
    val category: String?,
    val condition: String?,
    val notes: String?,
    val price: String?,
    val location: String?,
    val photos: List<String>,
    val metadata: ItemMetadata?
)

data class ItemMetadata(
    val capturedDate: String,
    val gpsLocation: GpsLocation?,
    val voiceNote: String?,
    val barcode: String?,
    val customFields: Map<String, String>?
)

data class GpsLocation(
    val latitude: Double,
    val longitude: Double,
    val accuracy: Float
)