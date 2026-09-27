import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useRef, useState } from "react";
import {
  Animated,
  Easing,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

type Screen =
  | "welcome"
  | "home"
  | "missions"
  | "missionDetail"
  | "scan"
  | "complete"
  | "progress"
  | "learning"
  | "future";

type Mission = {
  id: number;
  title: string;
  category: string;
  description: string;
  points: number;
  tip: string;
  whyMatter: string;
  detectedLabel: string;
  learningPoint: string;
};

const STORAGE_KEY = "ecoquest-progress";

const missions: Mission[] = [
  {
    id: 1,
    title: "Recycling Bin Mission",
    category: "Recycling",
    description:
      "Find a recycling bin nearby and complete a scan-style interaction.",
    points: 50,
    tip: "Rinse food containers before recycling them to reduce contamination.",
    whyMatter:
      "Proper recycling helps reduce waste and prevents recyclable items from being contaminated.",
    detectedLabel: "Recycling Bin Detected",
    learningPoint:
      "Recycling is more effective when items are clean and sorted properly.",
  },
  {
    id: 2,
    title: "Green Space Mission",
    category: "Green Spaces",
    description:
      "Observe a nearby green space and learn how it supports urban sustainability.",
    points: 40,
    tip: "Green spaces can help cool urban areas and improve air quality.",
    whyMatter:
      "Green spaces support biodiversity, reduce heat, and make urban areas healthier for people.",
    detectedLabel: "Green Space Detected",
    learningPoint:
      "Green spaces can reduce urban heat and improve the quality of public spaces.",
  },
  {
    id: 3,
    title: "Energy Saving Mission",
    category: "Energy",
    description: "Identify one energy-saving action in your surroundings.",
    points: 30,
    tip: "Turning off unused lights and devices helps reduce energy waste.",
    whyMatter:
      "Saving energy reduces electricity use and supports more sustainable daily habits.",
    detectedLabel: "Energy-Saving Action Detected",
    learningPoint:
      "Small daily energy-saving actions can reduce unnecessary electricity use.",
  },
  {
    id: 4,
    title: "Water Conservation Mission",
    category: "Water",
    description:
      "Spot a water-saving fixture or habit nearby, such as a low-flow tap or water-saving sign.",
    points: 35,
    tip: "Fixing a dripping tap can save many litres of water over time.",
    whyMatter:
      "Conserving water protects freshwater supplies and reduces the energy used to treat and pump water.",
    detectedLabel: "Water-Saving Feature Detected",
    learningPoint:
      "Small water-saving habits can reduce waste and support more sustainable daily routines.",
  },
  {
    id: 5,
    title: "Composting Mission",
    category: "Waste Reduction",
    description:
      "Find a compost bin or garden compost area and learn how organic waste can be reused.",
    points: 45,
    tip: "Composting food scraps keeps them out of landfills and turns them into useful soil material.",
    whyMatter:
      "Composting turns organic waste into nutrient-rich soil and reduces waste sent to landfill.",
    detectedLabel: "Compost Bin Detected",
    learningPoint:
      "Composting helps reduce landfill waste and turns organic materials into something useful.",
  },
];

const totalAvailablePoints = missions.reduce(
  (sum, mission) => sum + mission.points,
  0,
);

export default function App() {
  const [screen, setScreen] = useState<Screen>("welcome");
  const [selectedMission, setSelectedMission] = useState<Mission | null>(null);
  const [points, setPoints] = useState(0);
  const [completedMissions, setCompletedMissions] = useState<number[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isScanning, setIsScanning] = useState(true);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const scanLineAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    loadProgress();
  }, []);

  useEffect(() => {
    if (isLoaded) {
      saveProgress();
    }
  }, [points, completedMissions, isLoaded]);

  useEffect(() => {
    if (screen !== "scan") return;

    setIsScanning(true);

    const timeout = setTimeout(() => {
      setIsScanning(false);
    }, 1400);

    scanLineAnim.setValue(0);

    const scanAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(scanLineAnim, {
          toValue: 1,
          duration: 800,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
        Animated.timing(scanLineAnim, {
          toValue: 0,
          duration: 800,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
      ]),
    );

    scanAnimation.start();

    return () => {
      clearTimeout(timeout);
      scanAnimation.stop();
    };
  }, [screen, selectedMission]);

  const loadProgress = async () => {
    try {
      const savedProgress = await AsyncStorage.getItem(STORAGE_KEY);

      if (savedProgress) {
        const parsedProgress = JSON.parse(savedProgress);

        if (typeof parsedProgress.points === "number") {
          setPoints(parsedProgress.points);
        }

        if (Array.isArray(parsedProgress.completedMissions)) {
          setCompletedMissions(parsedProgress.completedMissions);
        }
      }
    } catch (error) {
      console.log("Error loading progress:", error);
    } finally {
      setIsLoaded(true);
    }
  };

  const saveProgress = async () => {
    try {
      const progressData = {
        points,
        completedMissions,
      };

      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(progressData));
    } catch (error) {
      console.log("Error saving progress:", error);
    }
  };

  const selectMission = (mission: Mission) => {
    setSelectedMission(mission);
    setScreen("missionDetail");
  };

  const completeMission = () => {
    if (!selectedMission || isScanning) return;

    const alreadyCompleted = completedMissions.includes(selectedMission.id);

    if (!alreadyCompleted) {
      setPoints(points + selectedMission.points);
      setCompletedMissions([...completedMissions, selectedMission.id]);
    }

    setScreen("complete");
  };

  const resetProgress = async () => {
    try {
      await AsyncStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.log("Error resetting progress:", error);
    }

    setPoints(0);
    setCompletedMissions([]);
    setSelectedMission(null);
    setShowResetConfirm(false);
    setScreen("welcome");
  };

  const getBadgeStatus = () => {
    if (completedMissions.length === 0) {
      return "No badge yet";
    }

    if (completedMissions.length === missions.length) {
      return "Sustainability Champion unlocked";
    }

    if (completedMissions.length >= Math.ceil(missions.length / 2)) {
      return "Eco Enthusiast unlocked";
    }

    return "Eco Explorer unlocked";
  };

  const getBadgeTitle = () => {
    if (completedMissions.length === 0) {
      return "🔒 No Badge Yet";
    }

    if (completedMissions.length === missions.length) {
      return "🏆 Sustainability Champion";
    }

    if (completedMissions.length >= Math.ceil(missions.length / 2)) {
      return "🌍 Eco Enthusiast Badge";
    }

    return "🏅 Eco Explorer Badge";
  };

  const getBadgeDescription = () => {
    if (completedMissions.length === 0) {
      return "Complete one mission to unlock your first badge.";
    }

    if (completedMissions.length === missions.length) {
      return "Unlocked after completing all available eco missions.";
    }

    if (completedMissions.length >= Math.ceil(missions.length / 2)) {
      return "Unlocked after completing more than half of the missions.";
    }

    return "Unlocked after completing your first eco mission.";
  };

  const getProgressPercentage = (): `${number}%` => {
    return `${Math.round((completedMissions.length / missions.length) * 100)}%`;
  };

  const getCompletedMissionObjects = () => {
    return missions.filter((mission) => completedMissions.includes(mission.id));
  };

  if (!isLoaded) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.phoneFrame}>
          <View style={styles.loadingContainer}>
            <Text style={styles.logo}>🌱 EcoQuest AR</Text>
            <Text style={styles.subtitle}>Loading saved progress...</Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.phoneFrame}>
        <ScrollView contentContainerStyle={styles.container}>
          {screen === "welcome" && (
            <View>
              <Text style={styles.logo}>🌱 EcoQuest AR</Text>

              <Text style={styles.title}>
                Gamified urban exploration for a greener future
              </Text>

              <View style={styles.card}>
                <Text style={styles.cardTitle}>About this prototype</Text>
                <Text style={styles.bodyText}>
                  Complete eco missions, learn sustainability tips, and earn
                  rewards as you explore your surroundings.
                </Text>
              </View>

              <View style={styles.pillRow}>
                <Text style={styles.pill}>AR-style scan</Text>
                <Text style={styles.pill}>{missions.length} missions</Text>
                <Text style={styles.pill}>Badges</Text>
                <Text style={styles.pill}>Saved progress</Text>
              </View>

              <PrimaryButton
                label="Start Exploring"
                onPress={() => setScreen("home")}
              />
            </View>
          )}

          {screen === "home" && (
            <View>
              <Text style={styles.logo}>EcoQuest AR</Text>

              <Text style={styles.subtitle}>
                Learn sustainability through simple urban missions.
              </Text>

              <View style={styles.statsBox}>
                <Text style={styles.statsText}>
                  Total Points: {points} / {totalAvailablePoints}
                </Text>
                <Text style={styles.statsText}>
                  Missions Completed: {completedMissions.length} /{" "}
                  {missions.length}
                </Text>
                <Text style={styles.statsText}>
                  Badge Status: {getBadgeStatus()}
                </Text>
              </View>

              <View style={styles.card}>
                <Text style={styles.cardTitle}>Today's Goal</Text>
                <Text style={styles.bodyText}>
                  Complete one eco mission and learn one sustainability tip.
                </Text>
              </View>

              <View style={styles.card}>
                <Text style={styles.cardTitle}>Progress Saving</Text>
                <Text style={styles.bodyText}>
                  Your points and completed missions are saved locally on this
                  device.
                </Text>
              </View>

              <PrimaryButton
                label="View Missions"
                onPress={() => setScreen("missions")}
              />

              <SecondaryButton
                label="View Progress"
                onPress={() => setScreen("progress")}
              />

              <SecondaryButton
                label="Learning Summary"
                onPress={() => setScreen("learning")}
              />
            </View>
          )}

          {screen === "missions" && (
            <View>
              <Header
                title="Available Eco Missions"
                onBack={() => setScreen("home")}
              />

              {missions.map((mission) => {
                const completed = completedMissions.includes(mission.id);

                return (
                  <Pressable
                    key={mission.id}
                    style={styles.missionCard}
                    onPress={() => selectMission(mission)}
                  >
                    <View style={styles.missionTopRow}>
                      <Text style={styles.missionTitle}>{mission.title}</Text>
                      {completed && (
                        <Text style={styles.completedBadge}>Done</Text>
                      )}
                    </View>

                    <Text style={styles.category}>{mission.category}</Text>
                    <Text style={styles.bodyText}>{mission.description}</Text>
                    <Text style={styles.points}>
                      Reward: {mission.points} points
                    </Text>

                    {completed && (
                      <Text style={styles.completed}>✓ Completed</Text>
                    )}
                  </Pressable>
                );
              })}
            </View>
          )}

          {screen === "missionDetail" && selectedMission && (
            <View>
              <Header
                title="Mission Detail"
                onBack={() => setScreen("missions")}
              />

              <View style={styles.card}>
                <Text style={styles.cardTitle}>{selectedMission.title}</Text>
                <Text style={styles.category}>{selectedMission.category}</Text>
                <Text style={styles.bodyText}>
                  {selectedMission.description}
                </Text>
                <Text style={styles.points}>
                  Reward: {selectedMission.points} points
                </Text>
              </View>

              <View style={styles.tipBox}>
                <Text style={styles.cardTitle}>Why this matters</Text>
                <Text style={styles.bodyText}>{selectedMission.whyMatter}</Text>
              </View>

              <PrimaryButton
                label="Start AR-Style Scan"
                onPress={() => setScreen("scan")}
              />

              <SecondaryButton
                label="Back to Missions"
                onPress={() => setScreen("missions")}
              />
            </View>
          )}

          {screen === "scan" && selectedMission && (
            <View>
              <Header
                title="AR-Style Scan"
                onBack={() => setScreen("missionDetail")}
              />

              <View style={styles.scanBox}>
                <Text style={styles.scanIcon}>📷</Text>

                <Text style={styles.scanText}>
                  {isScanning ? "Scanning eco feature..." : "Feature found!"}
                </Text>

                <View style={styles.scanFrame}>
                  <Animated.View
                    style={[
                      styles.scanLine,
                      {
                        transform: [
                          {
                            translateY: scanLineAnim.interpolate({
                              inputRange: [0, 1],
                              outputRange: [-28, 28],
                            }),
                          },
                        ],
                      },
                    ]}
                  />
                </View>

                {isScanning ? (
                  <Text style={styles.bodyTextCenter}>
                    Hold steady while EcoQuest looks for a match...
                  </Text>
                ) : (
                  <>
                    <Text style={styles.detectedText}>
                      {selectedMission.detectedLabel}
                    </Text>

                    <Text style={styles.bodyTextCenter}>
                      This screen represents the AR-style interaction in the
                      prototype. In a future version, this could be improved
                      with real camera or AR object recognition.
                    </Text>
                  </>
                )}
              </View>

              <PrimaryButton
                label={isScanning ? "Scanning..." : "Complete Scan"}
                onPress={completeMission}
                disabled={isScanning}
              />
            </View>
          )}

          {screen === "complete" && selectedMission && (
            <View>
              <Text style={styles.logo}>✅ Mission Complete!</Text>

              <View style={styles.card}>
                <Text style={styles.cardTitle}>{selectedMission.title}</Text>
                <Text style={styles.points}>
                  You earned {selectedMission.points} points.
                </Text>
                <Text style={styles.completed}>Badge progress updated</Text>
              </View>

              <View style={styles.tipBox}>
                <Text style={styles.cardTitle}>Sustainability Tip</Text>
                <Text style={styles.bodyText}>{selectedMission.tip}</Text>
              </View>

              <View style={styles.card}>
                <Text style={styles.cardTitle}>Saved Progress</Text>
                <Text style={styles.bodyText}>
                  Your updated points and mission progress have been saved
                  locally.
                </Text>
              </View>

              <PrimaryButton
                label="View Progress"
                onPress={() => setScreen("progress")}
              />

              <SecondaryButton
                label="Learning Summary"
                onPress={() => setScreen("learning")}
              />

              <SecondaryButton
                label="Back to Missions"
                onPress={() => setScreen("missions")}
              />
            </View>
          )}

          {screen === "progress" && (
            <View>
              <Header title="My Progress" onBack={() => setScreen("home")} />

              <View style={styles.statsBox}>
                <Text style={styles.statsText}>
                  Total Points: {points} / {totalAvailablePoints}
                </Text>
                <Text style={styles.statsText}>
                  Missions Completed: {completedMissions.length} /{" "}
                  {missions.length}
                </Text>
                <Text style={styles.statsText}>
                  Badge Status: {getBadgeStatus()}
                </Text>
              </View>

              <View style={styles.progressBarBackground}>
                <View
                  style={[
                    styles.progressBarFill,
                    { width: getProgressPercentage() },
                  ]}
                />
              </View>

              <View style={styles.card}>
                <Text style={styles.cardTitle}>{getBadgeTitle()}</Text>
                <Text style={styles.bodyText}>{getBadgeDescription()}</Text>
              </View>

              {completedMissions.length === missions.length && (
                <View style={styles.tipBox}>
                  <Text style={styles.cardTitle}>
                    🎉 All missions complete!
                  </Text>
                  <Text style={styles.bodyText}>
                    You have explored every eco mission in this prototype. You
                    can review your learning summary or reset the prototype to
                    test the flow again.
                  </Text>
                </View>
              )}

              <View style={styles.card}>
                <Text style={styles.cardTitle}>Completed Missions</Text>

                {completedMissions.length === 0 ? (
                  <Text style={styles.bodyText}>
                    No missions completed yet.
                  </Text>
                ) : (
                  getCompletedMissionObjects().map((mission) => (
                    <Text key={mission.id} style={styles.bodyText}>
                      ✓ {mission.title}
                    </Text>
                  ))
                )}
              </View>

              <View style={styles.card}>
                <Text style={styles.cardTitle}>Local Storage</Text>
                <Text style={styles.bodyText}>
                  This prototype saves progress on the device using local
                  storage. This means the user's mission progress can remain
                  after refreshing or reopening the app.
                </Text>
              </View>

              <PrimaryButton
                label="Continue Missions"
                onPress={() => setScreen("missions")}
              />

              <SecondaryButton
                label="Learning Summary"
                onPress={() => setScreen("learning")}
              />

              <SecondaryButton
                label="Future Improvements"
                onPress={() => setScreen("future")}
              />

              {!showResetConfirm ? (
                <SecondaryButton
                  label="Reset Prototype"
                  onPress={() => setShowResetConfirm(true)}
                />
              ) : (
                <View style={styles.resetBox}>
                  <Text style={styles.cardTitle}>Reset prototype?</Text>
                  <Text style={styles.bodyText}>
                    This will clear all saved points and completed missions on
                    this device.
                  </Text>

                  <PrimaryButton
                    label="Confirm Reset"
                    onPress={resetProgress}
                  />

                  <SecondaryButton
                    label="Cancel"
                    onPress={() => setShowResetConfirm(false)}
                  />
                </View>
              )}
            </View>
          )}

          {screen === "learning" && (
            <View>
              <Header
                title="Learning Summary"
                onBack={() => setScreen("progress")}
              />

              <View style={styles.statsBox}>
                <Text style={styles.statsText}>Total Points: {points}</Text>
                <Text style={styles.statsText}>
                  Learning Progress: {completedMissions.length} /{" "}
                  {missions.length} missions
                </Text>
              </View>

              <View style={styles.card}>
                <Text style={styles.cardTitle}>What you have completed</Text>

                {completedMissions.length === 0 ? (
                  <Text style={styles.bodyText}>
                    No missions completed yet. Complete a mission to build your
                    learning summary.
                  </Text>
                ) : (
                  getCompletedMissionObjects().map((mission) => (
                    <Text key={mission.id} style={styles.bodyText}>
                      ✓ {mission.title}
                    </Text>
                  ))
                )}
              </View>

              <View style={styles.tipBox}>
                <Text style={styles.cardTitle}>What you have learned</Text>

                {completedMissions.length === 0 ? (
                  <Text style={styles.bodyText}>
                    Sustainability learning points will appear here after
                    missions are completed.
                  </Text>
                ) : (
                  getCompletedMissionObjects().map((mission) => (
                    <Text key={mission.id} style={styles.bodyText}>
                      • {mission.learningPoint}
                    </Text>
                  ))
                )}
              </View>

              <View style={styles.card}>
                <Text style={styles.cardTitle}>Prototype Progress</Text>
                <Text style={styles.bodyText}>
                  This screen was added after the earlier prototype. It helps
                  users review completed missions and connect the rewards to
                  actual sustainability learning.
                </Text>
              </View>

              <PrimaryButton
                label="Continue Missions"
                onPress={() => setScreen("missions")}
              />

              <SecondaryButton
                label="Back to Progress"
                onPress={() => setScreen("progress")}
              />
            </View>
          )}

          {screen === "future" && (
            <View>
              <Header
                title="Future Improvements"
                onBack={() => setScreen("progress")}
              />

              <View style={styles.card}>
                <Text style={styles.cardTitle}>Improvements Added</Text>
                <Text style={styles.bodyText}>
                  ✓ Two new missions: Water Conservation and Composting
                </Text>
                <Text style={styles.bodyText}>
                  ✓ Three-tier badge system: Explorer, Enthusiast, Champion
                </Text>
                <Text style={styles.bodyText}>
                  ✓ Simulated scan delay with animated scan line
                </Text>
                <Text style={styles.bodyText}>
                  ✓ Local storage to save user progress
                </Text>
                <Text style={styles.bodyText}>
                  ✓ Learning summary screen added
                </Text>
                <Text style={styles.bodyText}>
                  ✓ Fixed reset prototype with confirmation step
                </Text>
              </View>

              <View style={styles.tipBox}>
                <Text style={styles.cardTitle}>Future Work</Text>
                <Text style={styles.bodyText}>
                  • Real AR object recognition
                </Text>
                <Text style={styles.bodyText}>
                  • Cloud database saving using Firebase
                </Text>
                <Text style={styles.bodyText}>
                  • Location-based eco missions
                </Text>
                <Text style={styles.bodyText}>
                  • Leaderboard or weekly challenges
                </Text>
                <Text style={styles.bodyText}>
                  • User accounts and long-term progress tracking
                </Text>
              </View>
            </View>
          )}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

function Header({ title, onBack }: { title: string; onBack: () => void }) {
  return (
    <View style={styles.header}>
      <Pressable onPress={onBack}>
        <Text style={styles.backText}>‹ Back</Text>
      </Pressable>

      <Text style={styles.headerTitle}>{title}</Text>
    </View>
  );
}

function PrimaryButton({
  label,
  onPress,
  disabled,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
}) {
  return (
    <Pressable
      style={[styles.primaryButton, disabled && styles.disabled]}
      onPress={onPress}
      disabled={disabled}
    >
      <Text style={styles.primaryButtonText}>{label}</Text>
    </Pressable>
  );
}

function SecondaryButton({
  label,
  onPress,
}: {
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable style={styles.secondaryButton} onPress={onPress}>
      <Text style={styles.secondaryButtonText}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#d9e8df",
    alignItems: "center",
    justifyContent: "center",
  },
  phoneFrame: {
    width: "100%",
    maxWidth: 390,
    minHeight: 780,
    maxHeight: "96%",
    alignSelf: "center",
    backgroundColor: "#eef8f1",
    borderRadius: 36,
    overflow: "hidden",
    borderWidth: 8,
    borderColor: "#111",
  },
  loadingContainer: {
    flex: 1,
    minHeight: 760,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  container: {
    padding: 20,
    paddingBottom: 40,
  },
  logo: {
    fontSize: 32,
    fontWeight: "800",
    marginBottom: 10,
    color: "#1f6f3f",
  },
  title: {
    fontSize: 22,
    fontWeight: "800",
    color: "#143d2b",
    marginBottom: 20,
    lineHeight: 30,
  },
  subtitle: {
    fontSize: 16,
    color: "#355343",
    marginBottom: 18,
    lineHeight: 23,
  },
  card: {
    backgroundColor: "white",
    padding: 18,
    borderRadius: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#d8eadf",
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 8,
    color: "#143d2b",
  },
  bodyText: {
    fontSize: 15,
    lineHeight: 22,
    color: "#355343",
    marginBottom: 4,
  },
  bodyTextCenter: {
    fontSize: 15,
    lineHeight: 22,
    color: "#355343",
    textAlign: "center",
    marginTop: 10,
  },
  pillRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 18,
  },
  pill: {
    backgroundColor: "#dff3e6",
    color: "#1f6f3f",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 999,
    fontWeight: "700",
    marginRight: 8,
    marginBottom: 8,
  },
  statsBox: {
    backgroundColor: "#dff3e6",
    padding: 16,
    borderRadius: 16,
    marginBottom: 16,
  },
  statsText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1f6f3f",
    marginBottom: 4,
  },
  primaryButton: {
    backgroundColor: "#1f6f3f",
    padding: 16,
    borderRadius: 14,
    alignItems: "center",
    marginBottom: 12,
  },
  primaryButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "700",
  },
  secondaryButton: {
    backgroundColor: "white",
    padding: 16,
    borderRadius: 14,
    alignItems: "center",
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#1f6f3f",
  },
  secondaryButtonText: {
    color: "#1f6f3f",
    fontSize: 16,
    fontWeight: "700",
  },
  disabled: {
    opacity: 0.55,
  },
  header: {
    marginBottom: 16,
  },
  backText: {
    fontSize: 16,
    color: "#1f6f3f",
    marginBottom: 10,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: "800",
    color: "#143d2b",
  },
  missionCard: {
    backgroundColor: "white",
    padding: 18,
    borderRadius: 18,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#d8eadf",
  },
  missionTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  missionTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#143d2b",
    marginBottom: 4,
    flex: 1,
    paddingRight: 8,
  },
  category: {
    fontSize: 14,
    fontWeight: "700",
    color: "#2b8a57",
    marginBottom: 8,
  },
  points: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1f6f3f",
    marginTop: 10,
  },
  completed: {
    color: "#1f6f3f",
    marginTop: 8,
    fontWeight: "700",
  },
  completedBadge: {
    backgroundColor: "#dff3e6",
    color: "#1f6f3f",
    fontSize: 12,
    fontWeight: "800",
    paddingVertical: 5,
    paddingHorizontal: 8,
    borderRadius: 999,
  },
  scanBox: {
    backgroundColor: "white",
    minHeight: 360,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: "#1f6f3f",
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    marginBottom: 18,
  },
  scanIcon: {
    fontSize: 58,
    marginBottom: 12,
  },
  scanText: {
    fontSize: 21,
    fontWeight: "800",
    color: "#143d2b",
    marginBottom: 14,
    textAlign: "center",
  },
  scanFrame: {
    width: "90%",
    height: 90,
    borderWidth: 2,
    borderColor: "#9fd8b5",
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 14,
    backgroundColor: "#f4fbf6",
    overflow: "hidden",
  },
  scanLine: {
    height: 4,
    width: "80%",
    backgroundColor: "#5bcf88",
    borderRadius: 4,
  },
  detectedText: {
    backgroundColor: "#dff3e6",
    color: "#1f6f3f",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 999,
    fontWeight: "800",
    marginBottom: 8,
    textAlign: "center",
  },
  tipBox: {
    backgroundColor: "#fff8dd",
    padding: 18,
    borderRadius: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#f3df91",
  },
  resetBox: {
    backgroundColor: "#fff8dd",
    padding: 18,
    borderRadius: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#f3df91",
  },
  progressBarBackground: {
    backgroundColor: "#d8eadf",
    height: 16,
    borderRadius: 999,
    marginBottom: 16,
    overflow: "hidden",
  },
  progressBarFill: {
    backgroundColor: "#1f6f3f",
    height: "100%",
  },
});
