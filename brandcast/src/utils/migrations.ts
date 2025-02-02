import { collection, getDocs, doc, writeBatch } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export const migrateProfileImageUrlToImage = async () => {
  const batch = writeBatch(db);
  let batchCount = 0;
  let totalUpdated = 0;

  try {
    // Update global streamers collection
    const streamersRef = collection(db, 'streamers');
    const streamersSnapshot = await getDocs(streamersRef);

    for (const streamerDoc of streamersSnapshot.docs) {
      const data = streamerDoc.data();
      if (data.profileImageUrl && !data.image) {
        batch.update(doc(db, 'streamers', streamerDoc.id), {
          image: data.profileImageUrl,
          profileImageUrl: null // Mark for deletion
        });
        batchCount++;
        totalUpdated++;

        if (batchCount >= 400) {
          await batch.commit();
          batchCount = 0;
        }
      }
    }

    // Commit any remaining updates
    if (batchCount > 0) {
      await batch.commit();
    }

    console.log(`Migration completed. Updated ${totalUpdated} documents.`);
    return { success: true, updatedCount: totalUpdated };
  } catch (error) {
    console.error('Migration failed:', error);
    return { success: false, error };
  }
};

export const migrateGameAndSponsors = async () => {
  const batch = writeBatch(db);
  let batchCount = 0;
  let totalUpdated = 0;

  try {
    // Update global streamers collection
    const streamersRef = collection(db, 'streamers');
    const streamersSnapshot = await getDocs(streamersRef);

    for (const streamerDoc of streamersSnapshot.docs) {
      const data = streamerDoc.data();
      const updates: any = {};
      let needsUpdate = false;

      // Update streamGame to game_name
      if (data.streamGame !== undefined) {
        updates.game_name = data.streamGame;
        updates.streamGame = null; // Mark for deletion
        needsUpdate = true;
      }

      // Update sponsors to just array of names
      if (Array.isArray(data.sponsors) && data.sponsors.length > 0 && typeof data.sponsors[0] === 'object') {
        updates.sponsors = data.sponsors.map((sponsor: { name: string }) => sponsor.name);
        needsUpdate = true;
      }

      if (needsUpdate) {
        batch.update(doc(db, 'streamers', streamerDoc.id), updates);
        batchCount++;
        totalUpdated++;

        if (batchCount >= 400) {
          await batch.commit();
          batchCount = 0;
        }
      }
    }

    // Commit any remaining updates
    if (batchCount > 0) {
      await batch.commit();
    }

    console.log(`Migration completed. Updated ${totalUpdated} documents.`);
    return { success: true, updatedCount: totalUpdated };
  } catch (error) {
    console.error('Migration failed:', error);
    return { success: false, error };
  }
};

export const migrateDisplayNameToName = async () => {
  const batch = writeBatch(db);
  let batchCount = 0;
  let totalUpdated = 0;

  try {
    // Update global streamers collection
    const streamersRef = collection(db, 'streamers');
    const streamersSnapshot = await getDocs(streamersRef);

    for (const streamerDoc of streamersSnapshot.docs) {
      const data = streamerDoc.data();
      if (data.displayName !== undefined) {
        batch.update(doc(db, 'streamers', streamerDoc.id), {
          name: data.displayName,
          displayName: null // Mark for deletion
        });
        batchCount++;
        totalUpdated++;

        if (batchCount >= 400) {
          await batch.commit();
          batchCount = 0;
        }
      }
    }

    // Update analysedStreamers collection
    const analysedStreamersRef = collection(db, 'analysedStreamers');
    const analysedStreamersSnapshot = await getDocs(analysedStreamersRef);

    for (const streamerDoc of analysedStreamersSnapshot.docs) {
      const data = streamerDoc.data();
      if (data.displayName !== undefined) {
        batch.update(doc(db, 'analysedStreamers', streamerDoc.id), {
          name: data.displayName,
          displayName: null // Mark for deletion
        });
        batchCount++;
        totalUpdated++;

        if (batchCount >= 400) {
          await batch.commit();
          batchCount = 0;
        }
      }
    }

    // Update history collection
    const historyRef = collection(db, 'history');
    const historySnapshot = await getDocs(historyRef);

    for (const historyDoc of historySnapshot.docs) {
      const data = historyDoc.data();
      if (data.displayName !== undefined) {
        batch.update(doc(db, 'history', historyDoc.id), {
          name: data.displayName,
          displayName: null // Mark for deletion
        });
        batchCount++;
        totalUpdated++;

        if (batchCount >= 400) {
          await batch.commit();
          batchCount = 0;
        }
      }
    }

    // Update user-specific collections
    const usersRef = collection(db, 'users');
    const usersSnapshot = await getDocs(usersRef);

    for (const userDoc of usersSnapshot.docs) {
      const userId = userDoc.id;

      // Update user's streamerAnalysis collection
      const userAnalysisRef = collection(db, `users/${userId}/streamerAnalysis`);
      const userAnalysisSnapshot = await getDocs(userAnalysisRef);

      for (const analysisDoc of userAnalysisSnapshot.docs) {
        const data = analysisDoc.data();
        if (data.displayName !== undefined) {
          batch.update(doc(db, `users/${userId}/streamerAnalysis`, analysisDoc.id), {
            name: data.displayName,
            displayName: null // Mark for deletion
          });
          batchCount++;
          totalUpdated++;

          if (batchCount >= 400) {
            await batch.commit();
            batchCount = 0;
          }
        }
      }

      // Update user's history collection
      const userHistoryRef = collection(db, `users/${userId}/history`);
      const userHistorySnapshot = await getDocs(userHistoryRef);

      for (const historyDoc of userHistorySnapshot.docs) {
        const data = historyDoc.data();
        if (data.displayName !== undefined) {
          batch.update(doc(db, `users/${userId}/history`, historyDoc.id), {
            name: data.displayName,
            displayName: null // Mark for deletion
          });
          batchCount++;
          totalUpdated++;

          if (batchCount >= 400) {
            await batch.commit();
            batchCount = 0;
          }
        }
      }
    }

    // Commit any remaining updates
    if (batchCount > 0) {
      await batch.commit();
    }

    console.log(`Migration completed. Updated ${totalUpdated} documents.`);
    return { success: true, updatedCount: totalUpdated };
  } catch (error) {
    console.error('Migration failed:', error);
    return { success: false, error };
  }
}; 